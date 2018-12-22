import React, { Component } from 'react'
import { Alert, Clipboard, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import Currency from 'components/currency'
import OriginButton from 'components/origin-button'

import originWallet from '../OriginWallet'

const IMAGES_PATH = '../../assets/images/'

class WalletModal extends Component {
  render() {
    const { address, onPress, visible, wallet } = this.props
    const { dai, eth, ogn } = wallet.balances

    const ethBalance = web3.utils.fromWei(eth, 'ether')
    const privateKey = address ? web3.eth.accounts.wallet[0].privateKey : ''

    return (
      <Modal
        animationType="slide"
        visible={visible}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.nav}>
            <View style={styles.navImageContainer} />
            <View style={styles.navHeadingContainer}>
              <Text style={styles.heading}>Wallet Balances</Text>
            </View>
            <View style={styles.navImageContainer}>
              <TouchableOpacity onPress={onPress}>
                <Image source={require('../../assets/images/close-icon.png')} style={styles.close} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.addressContainer}>
            <Text style={styles.address}>{address}</Text>
          </View>
          <ScrollView
            style={styles.svContainer}
            contentContainerStyle={styles.walletSVContainer}
          >
            <Currency
              abbreviation={'ETH'}
              balance={ethBalance}
              labelColor={'#a27cff'}
              name="Ethereum"
              imageSource={require(`${IMAGES_PATH}eth-icon.png`)}
              vertical={true}
              withAdd={true}
              onPress={() => originWallet.giveMeEth('1')}
            />
            <Currency
              abbreviation={'OGN'}
              balance={ogn}
              labelColor={'#007fff'}
              name="Origin Token"
              imageSource={require(`${IMAGES_PATH}ogn-icon.png`)}
              vertical={true}
              onPress={() => Alert.alert('OGN can be earned by verifying your profile.')}
            />
            <Currency
              abbreviation={'DAI'}
              balance={dai}
              labelColor={'#fec100'}
              name="Maker Dai"
              imageSource={require(`${IMAGES_PATH}dai-icon.png`)}
              vertical={true}
              onPress={() => Alert.alert('DAI can be purchased on an exchange and transferred into this wallet.')}
            />
          </ScrollView>
          <View style={styles.buttonsContainer}>
            <OriginButton
              size="large"
              type="primary"
              style={styles.button}
              textStyle={{ fontSize: 18, fontWeight: '900' }}
              title={'Show Private Key'}
              onPress={() => Alert.alert('Private Key', privateKey)}
            />
            <OriginButton
              size="large"
              type="primary"
              style={styles.button}
              textStyle={{ fontSize: 18, fontWeight: '900' }}
              title={'Copy Private Key'}
              onPress={async () => {
                await Clipboard.setString(privateKey)

                Alert.alert('Copied to clipboard!')
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    )
  }
}

const mapStateToProps = ({ wallet }) => {
  return {
    wallet,
  }
}

export default connect(mapStateToProps)(WalletModal)

const styles = StyleSheet.create({
  address: {
    color: '#94a7b5',
    fontFamily: 'Lato',
    fontSize: 13,
    fontWeight: '300',
    textAlign: 'center',
  },
  addressContainer: {
    paddingHorizontal: 18 * 3,
    paddingVertical: 22,
  },
  button: {
    marginHorizontal: 10,
    marginTop: 10,
  },
  buttonsContainer: {
    flex: 1,
  },
  close: {
    margin: 'auto',
  },
  container: {
    backgroundColor: '#0b1823',
    flex: 1,
  },
  heading: {
    color: 'white',
    fontFamily: 'Poppins',
    fontSize: 17,
    marginVertical: 'auto',
    textAlign: 'center',
  },
  nav: {
    height: 44,
    flexDirection: 'row',
  },
  navHeadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 18 * 3,
  },
  walletSVContainer: {
    paddingHorizontal: 10,
  },
})
