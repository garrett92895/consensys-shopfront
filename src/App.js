import React, { Component } from 'react'
import ShopfrontContract from '../build/contracts/Shopfront.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      account: null,
      ownerAccount: null,
      shopfrontInstance: null,
      products: null
    }
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
      });

      this.instantiateContract()
      .then(() => {
        this.state.shopfrontInstance.owner().then(owner => {
          this.setState({
            ownerAccount: owner
          })
        })
      })
      .then(() => this.state.shopfrontInstance.getIdsLength())
      .then(idsLength => {
        let promises = []
        for(let i = 0; i < idsLength.toNumber(); i++) {
          promises.push(this.state.shopfrontInstance.ids(i))
        }
        return Promise.all(promises)
      })
      .then(ids => {
        let promises = []
        for(let i = 0; i < ids.length; i++) {
          promises.push(this.state.shopfrontInstance.products(ids[i]))
        }
        return Promise.all(promises)
      })
      .then(products => this.setState({products: products}))

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

  render() {
      console.log(this.state.products)
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
              <p>{this.state.products}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
