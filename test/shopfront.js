var Shopfront = artifacts.require("./Shopfront.sol");

let BigNumber = web3.BigNumber;

contract('Shopfront', function(accounts) {
    let contract;
    let productPrice = new BigNumber(web3.toWei(1, "ether"));

    beforeEach(() => {
        return Shopfront.new()
        .then(instance => contract = instance);
    });

    it("Test split funds", () => {
        return contract.createProduct(productPrice, 10, 1)
        .then(tx => {
            let logEvent = tx.logs[0];
            assert.strictEqual(logEvent.event, "LogProductCreation", "Wrong event or no event was triggered");
            assert.strictEqual(logEvent.args["id"].toString(), "1", "Id number was wrong");
        })
        .then(() => contract.ids(0))
        .then(id => contract.products(id))
        .then(product => {
            let price = product[0];
            let stock = product[1];
            assert.strictEqual(price.toString(), productPrice.toString(), "Price mismatch");
            assert.strictEqual(stock.toString(), "10", "Stock mismatch");   
        });
    });

    it("Test add stock", () => {
        return contract.createProduct(productPrice, 10, 1)
        .then(tx => contract.addStock(1, 5))
        .then(tx => {
            let logEvent = tx.logs[0];
            assert.strictEqual(logEvent.event, "LogStockAdded", "Wrong event or no event was triggered");
            assert.strictEqual(logEvent.args["id"].toString(), "1", "Id number was wrong");
            assert.strictEqual(logEvent.args["stockAdded"].toString(), "5", "Stock amount added was wrong");
        })
        .then(() => contract.ids(0))
        .then(id => contract.products(id))
        .then(product => {
            let price = product[0];
            let stock = product[1];
            assert.strictEqual(price.toString(), productPrice.toString(), "Price mismatch");
            assert.strictEqual(stock.toString(), "15", "Stock not added");   
        });
    });

    it("Test purchase item", () => {
        return contract.createProduct(productPrice, 10, 1)
        .then(tx => contract.purchaseItem(1, {from: accounts[1], value: productPrice}))
        .then(tx => {
            let logEvent = tx.logs[0];
            assert.strictEqual(logEvent.event, "LogProductPurchased", "Wrong event or no event was triggered");
            assert.strictEqual(logEvent.args["id"].toString(), "1", "Id number was wrong");
            assert.strictEqual(logEvent.args["purchaser"], accounts[1], "Purchaser address number was wrong");
        })
        .then(() => contract.ids(0))
        .then(id => contract.products(id))
        .then(product => {
            let price = product[0];
            let stock = product[1];
            assert.strictEqual(price.toString(), productPrice.toString(), "Price mismatch");
            assert.strictEqual(stock.toString(), "9", "Stock not added");   
        });
    });

    it("Test withdrawal", () => {
        let ownerStartBalance = web3.eth.getBalance(accounts[0]);

        return contract.createProduct(productPrice, 10, 1)
        .then(tx => contract.purchaseItem(1, {from: accounts[1], value: productPrice}))
        .then(tx => contract.withdraw())
        .then(tx => assert.strictEqual(web3.eth.getBalance(contract.address).toString(), "0", "Contract wasn't emptied"))
        .then(() => assert.isBelow(ownerStartBalance, web3.eth.getBalance(accounts[0]), "Owner did not receive funds")); // Not foolproof, fails if gas cost of calling withdraw is greater than money received
    });
});
