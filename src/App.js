//TODO divide products list from header
//TODO divide each product in list
//TODO create product form
import React, { Component } from 'react'
import ShopfrontContract from '../build/contracts/Shopfront.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

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
    if(this.props.isOwner) {
      updateStockButton = (<button onClick={this.handleUpdateStock}>Increase Stock by 1</button>)
    }

    return (
      <div>
        <p>Id: {this.props.id} Price: {this.props.price} Stock: {this.props.stock}</p>
        <button onClick={this.handlePurchase}>Purchase</button>
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
      shopfrontInstance: null,
      products: []
    }

    this.updateProducts = this.updateProducts.bind(this)
    this.handlePurchase = this.handlePurchase.bind(this)
    this.handleUpdateStock = this.handleUpdateStock.bind(this)
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
      .then(() => this.updateProducts())
      .then(() => this.setWatchers())

    })
    .catch(error => {
      console.log(error)
      console.log('Error finding web3.')
    })
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
      this.state.shopfrontInstance...
//TODO implement
  }

  handleUpdateStock(id) {

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

    console.log(productComponents)

    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Shopfront</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <p>If your contracts compiled and migrated successfully, below will show a stored value of 5 (by default).</p>
              <p>Your account is: {this.state.account}</p>
              <p>The owner account is: {this.state.ownerAccount}</p>
              {productComponents}
            </div>
          </div>
        </main>
      </div>
    )
  }
}

export default App
