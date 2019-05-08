'use strict'

import React, { Component } from 'react'
import {
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { connect } from 'react-redux'
import SafeAreaView from 'react-native-safe-area-view'
import { ethers } from 'ethers'

import OriginButton from 'components/origin-button'

class ImportAccountScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      method: 'mnemonic',
      value: '',
      error: ''
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidUpdate() {
    const { value, error } = this.state
    // Remove the error if no value
    if (error && !value) {
      this.setState({ error: '' })
    }
  }

  handleChange(value) {
    if (this.state.method === 'mnemonic') {
      this.setState({ value })
    } else {
      // Private key, trim it
      this.setState({ value: value.trim() })
    }
  }

  /* Add a new account to the wallet based on the given mnemonic.
   * TODO: this logic should be in OriginWallet.js rather than here but to
   * catch errors for invalid mnemonics it needs to be here. This could be
   * improved with a refactor of the OriginWallet <> component communication.
   */
  handleSubmit() {
    let success
    if (this.state.method === 'mnemonic') {
      success = this.addAccountFromMnemonic()
    } else {
      success = this.addAccountFromPrivateKey()
    }
    if (success) {
      // Reset state of component
      this.setState({
        method: 'mnemonic',
        value: '',
        error: ''
      })
      const onSuccess = this.props.navigation.getParam('navigateOnSuccess')
      if (onSuccess) {
        this.props.navigation.navigate(onSuccess)
      }
    }
  }

  addAccountFromMnemonic() {
    // This is the default path but explicitly stated here for clarity
    const derivePath = "m/44'/60'/0'/0/0"
    // Web3js doesn't support wallet creation from a mnemonic, so somewhat
    // redundantly we have to include ethersjs. Perhaps migrate everything
    // away from web3js to ethersjs or the functionality will be added to web3js
    // sometime in the future, see:
    // https://github.com/ethereum/web3.js/issues/1594
    let wallet
    try {
      wallet = ethers.Wallet.fromMnemonic(this.state.value.trim(), derivePath)
    } catch (error) {
      let errorMessage = error.message
      if (errorMessage === 'invalid mnemonic') {
        errorMessage = 'That does not look like a valid recovery phrase.'
      }
      this.setState({
        error: errorMessage
      })
    }
    if (wallet) {
      DeviceEventEmitter.emit('addAccount', {
        address: wallet.address,
        mnemonic: wallet.mnemonic,
        privateKey: wallet.privateKey
      })
      return true
    }
  }

  addAccountFromPrivateKey() {
    let wallet
    try {
      let privateKey = this.state.value
      if (!privateKey.startsWith('0x') && /^[0-9a-fA-F]+$/.test(privateKey)) {
        privateKey = '0x' + privateKey
      }
      wallet = new ethers.Wallet(privateKey)
    } catch (error) {
      this.setState({ error: error.message })
    }
    if (wallet) {
      DeviceEventEmitter.emit('addAccount', {
        address: wallet.address,
        privateKey: wallet.privateKey
      })
      return true
    }
  }

  render() {
    if (this.state.method === 'mnemonic') {
      return this.renderMnemonicInput()
    } else {
      return this.renderPrivateKeyInput()
    }
  }

  renderMnemonicInput() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Enter Recovery Phrase</Text>
          <Text style={styles.subtitle}>
            Enter the 12 words in the correct order
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            multiline={true}
            onChangeText={this.handleChange}
            onSubmitEditing={this.handleSubmit}
            style={[styles.input, this.state.error ? styles.invalid : {}]}
          />
          {this.state.error.length > 0 && (
            <Text style={styles.invalid}>{this.state.error}</Text>
          )}
        </View>
        <View style={styles.buttonsContainer}>
          <OriginButton
            size="large"
            type="link"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={'Use a private key'}
            onPress={() => this.setState({ method: 'privatekey' })}
          />
          <OriginButton
            size="large"
            type="primary"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={'Done'}
            onPress={this.handleSubmit}
          />
        </View>
      </SafeAreaView>
    )
  }

  renderPrivateKeyInput() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Enter Your Private Key</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            multiline={true}
            onChangeText={this.handleChange}
            onSubmitEditing={this.handleSubmit}
            style={[styles.input, this.state.error ? styles.invalid : {}]}
          />
          {this.state.error.length > 0 && (
            <Text style={styles.invalid}>{this.state.error}</Text>
          )}
        </View>
        <View style={styles.buttonsContainer}>
          <OriginButton
            size="large"
            type="link"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={'Use a recovery phrase'}
            onPress={() => this.setState({ method: 'mnemonic' })}
          />
          <OriginButton
            size="large"
            type="primary"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={'Done'}
            onPress={this.handleSubmit}
          />
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'column',
    paddingTop: 0
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  buttonsContainer: {
    paddingTop: 10,
    width: '100%'
  },
  button: {
    marginBottom: 20,
    marginHorizontal: 50
  },
  title: {
    fontFamily: 'Lato',
    fontSize: 36,
    fontWeight: '600',
    marginHorizontal: 50,
    paddingBottom: 30,
    textAlign: 'center'
  },
  subtitle: {
    fontFamily: 'Lato',
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 50,
    paddingBottom: 30,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#eaf0f3',
    borderColor: '#c0cbd4',
    borderWidth: 1,
    borderRadius: 5,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
    width: 300
  },
  invalid: {
    borderColor: '#ff0000',
    color: '#ff0000'
  }
})

const mapStateToProps = ({ settings, wallet }) => {
  return { settings, wallet }
}

export default connect(
  mapStateToProps,
  {}
)(ImportAccountScreen)
