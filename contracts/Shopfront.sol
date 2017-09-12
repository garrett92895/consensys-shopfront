pragma solidity 0.4.15;

contract Shopfront {
    struct Product {
        uint128 price;
        uint64 stock;
    }

    event LogProductCreation(uint64 indexed id);
    event LogStockAdded(uint64 indexed id, uint64 indexed stockAdded);
    event LogProductPurchased(uint64 indexed id, address indexed purchaser);

    address public owner;
    mapping(uint64 => Product) public products;
    uint64[] public ids;

    modifier onlyOwner
    {
        require(msg.sender == owner);
        _;
    }

    function Shopfront()
    {
        owner = msg.sender;
    }

    function createProduct(uint128 price, uint64 stock, uint64 id)
      public
      onlyOwner
    {
        require(price > 0);
        require(stock > 0);
        require(products[id].price == 0);

        Product memory newProduct = Product(price, stock);
        LogProductCreation(id);
        products[id] = newProduct;
        ids.push(id);
    }

    function withdraw()
      public
      onlyOwner
    {
        owner.transfer(this.balance);
    }

    function addStock(uint64 id, uint64 additionalStock)
      public
      onlyOwner
    {
        Product storage product = products[id];

        require(product.price > 0);

        uint64 currentStock = product.stock;
        uint64 newStock = currentStock + additionalStock;

        assert(newStock >= currentStock);

        LogStockAdded(id, additionalStock);
        product.stock = newStock;
    }

    function purchaseItem(uint64 id)
      payable
      public
    {
        Product storage product = products[id];
        uint128 price = product.price;
        uint64 stock = product.stock;
        
        require(msg.value == price); //For simplicity, don't allow overpaying
        require(stock > 0); //Simulatenously checks that there is stock and that products[id] exists

        LogProductPurchased(id, msg.sender);
        product.stock -= 1;
    }

    function getIdsLength()
      public
      constant
      returns(uint256)
    {
        return ids.length;
    }
}
