var Shopfront = artifacts.require("./Shopfront.sol");

let BigNumber = web3.BigNumber;

contract('Shopfront', function(accounts) {
    let contract;
    let productPrice = new BigNumber(web3.toWei(1, "ether"));

    beforeEach(() => {
        return Shopfront.new()
        .then(instance => contract = instance);
    });

    it("Test create product", () => {
        console.log(contract);
        return contract.createProduct(productPrice, 10, 12)
        .then(tx => console.log(tx))
//        .then(balance => assert.isTrue(balance.equals(account1SendAmount), "Split funds balance mismatch"))
//        .then(() => contract.balances(accounts[2]))
//        .then(balance => assert.isTrue(balance.equals(account2SendAmount), "Split funds balance mismatch"))
//        .then(() => contract.totalBalance())
//        .then(totalBalance => assert.isTrue(amountToSend.equals(totalBalance), "Total balance not updated correctly"));
    });
});
