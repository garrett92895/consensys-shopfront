//TODO divide products list from header
//TODO divide each product in list
import React, { Component } from 'react'
import ShopfrontContract from '../build/contracts/Shopfront.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class CreateProductForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      id: '',
      price: '',
	  stock: ''
    }

    this.handleIdChange = this.handleIdChange.bind(this)
    this.handlePriceChange = this.handlePriceChange.bind(this)
    this.handleStockChange = this.handleStockChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleIdChange(event) {
    this.setState({id: event.target.value})
  }

  handlePriceChange(event) {
    this.setState({price: event.target.value})
  }

  handleStockChange(event) {
    this.setState({stock: event.target.value})
  }

  handleSubmit(event) {
    this.props.handleCreateProduct(this.state.id, this.state.price, this.state.stock)
    event.preventDefault()
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Id:
          <input type="number" value={this.state.id} onChange={this.handleIdChange} />
          Price:
          <input type="number" value={this.state.price} onChange={this.handlePriceChange} />
          Stock:
          <input type="number" value={this.state.stock} onChange={this.handleStockChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

class Product extends Component {
  constructor(props) {
    super(props)

    this.state = {

    }

    this.handlePurchase = this.handlePurchase.bind(this)
    this.handleUpdateStock = this.handleUpdateStock.bind(this)
  }

  handlePurchase() {
    this.props.handlePurchase(this.props.id)
  }

  handleUpdateStock() {
    this.props.handleUpdateStock(this.props.id)
  }

  render() {
    let updateStockButton = ""
    let purchaseButton = ""
    if(this.props.isOwner) {
      updateStockButton = (<button onClick={this.handleUpdateStock}>Increase Stock by 1</button>)
    }

    if(this.props.stock > 0) {
      purchaseButton = (<button onClick={this.handlePurchase}>Purchase</button>)
    }

    return (
      <div>
        <p>Id: {this.props.id} Price: {this.props.price} Stock: {this.props.stock}</p>
        {purchaseButton}
        {updateStockButton}
      </div>
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      account: null,
      ownerAccount: null,
      contractAddress: null,
      contractBalance: null,
      shopfrontInstance: null,
      products: []
    }

    this.updateProducts = this.updateProducts.bind(this)
    this.handlePurchase = this.handlePurchase.bind(this)
    this.handleUpdateStock = this.handleUpdateStock.bind(this)
    this.handleCreateProduct = this.handleCreateProduct.bind(this)
    this.withdraw = this.withdraw.bind(this)
    this.updateBalance = this.updateBalance.bind(this)
  }

  componentWillMount() {
    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      this.state.web3.eth.getAccounts((error, accounts) => {
        this.setState({
          account: accounts[0]
        })
      })

      this.instantiateContract()
      .then(() => {
        this.state.shopfrontInstance.owner().then(owner => {
          this.setState({
            ownerAccount: owner
          })
        })
      })
      .then(() => this.setWatchers())
      .then(() => this.updateProducts())
      .then(() => this.setState({contractAddress: this.state.shopfrontInstance.address}))
      .then(this.updateBalance)

    })
    .catch(error => {
      console.log(error)
      console.log('Error finding web3.')
    })
  }

  updateBalance() {
    return this.setState({contractBalance: this.state.web3.eth.getBalance(this.state.contractAddress).toString()})
  }

  withdraw() {
    return this.state.shopfrontInstance.withdraw({from: this.state.account})
    .then(this.updateBalance)
  }

  instantiateContract() {
    const contract = require('truffle-contract')
    const shopfront = contract(ShopfrontContract)
    shopfront.setProvider(this.state.web3.currentProvider)

    return shopfront.deployed()
    .then((instance) => {
      this.setState({
        shopfrontInstance: instance
      })
    })
  }

  setWatchers() {
    this.state.shopfrontInstance.LogProductCreation()
    .watch(this.updateProducts)

    this.state.shopfrontInstance.LogStockAdded()
    .watch(this.updateProducts)

    this.state.shopfrontInstance.LogProductPurchased()
    .watch(this.updateProducts)
  }

  updateProducts() {
    return this.state.shopfrontInstance.getIdsLength()
    .then(idsLength => {
      let promises = []
      for(let i = 0; i < idsLength.toNumber(); i++) {
        promises.push(this.state.shopfrontInstance.ids(i))
      }
      return Promise.all(promises)
    })
    .then(ids => {
      let promises = ids.map(id => {
        return this.state.shopfrontInstance.products(id)
        .then(product => {
          product[2] = id
          return product
        })
      })
      return Promise.all(promises)
    })
    .then(products => this.setState({products: products}))
  }

  handlePurchase(id) {
    let shopfrontInstance = this.state.shopfrontInstance
    let account = this.state.account

    return shopfrontInstance.products(id)
    .then(product => shopfrontInstance.purchaseItem(id, {from:account, value:product[0]}))
  }

  handleUpdateStock(id) {
    let shopfrontInstance = this.state.shopfrontInstance
    let account = this.state.account

    if(account === this.state.ownerAccount) {
      return shopfrontInstance.products(id)
      .then(product => shopfrontInstance.addStock(id, 1, {from:account}))
    }
  }

  handleCreateProduct(id, price, stock) {
    let shopfrontInstance = this.state.shopfrontInstance
    let account = this.state.account
    console.log(account)

    if(account === this.state.ownerAccount) {
      return shopfrontInstance.createProduct(price, stock, id, {from:account})
      .then(tx => console.log(tx))
      .catch((error) => {
        console.log(error)
        alert("Error creating product. Make sure id doesn't already exist and that price and stock are valid")   
      })
    }
  }

  render() {
    let productComponents = this.state.products.map(product => {
      return (
        <Product 
          isOwner={this.state.account === this.state.ownerAccount}
          key={product[2].toString()}
          price={product[0].toString()}
          stock={product[1].toString()}
          id={product[2].toString()}
          handlePurchase={this.handlePurchase}
          handleUpdateStock={this.handleUpdateStock}
        />
      )
    })

    let createProductForm
    if(this.state.account === this.state.ownerAccount) {
        createProductForm = (
          <div>
          <h3>Create new product</h3>
          <CreateProductForm handleCreateProduct={this.handleCreateProduct} />
          </div>
        )
    }

    let withdrawButton
    if(this.state.account === this.state.ownerAccount) {
        withdrawButton = (<button onClick={this.withdraw}>Withdraw funds</button>)
    }

    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Shopfront</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h3>Info</h3>
              <p>Your account is: {this.state.account}</p>
              <p>The owner account is: {this.state.ownerAccount}</p>
              <p>Contract balance: {this.state.contractBalance} wei</p>
              {withdrawButton}
              {createProductForm}
              <h3>Product List</h3>
              {productComponents}
            </div>
          </div>
        </main>
      </div>
    )
  }
}

export default App
