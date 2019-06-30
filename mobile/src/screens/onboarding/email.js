'use strict'

import React, { Component } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { connect } from 'react-redux'
import SafeAreaView from 'react-native-safe-area-view'
import { fbt } from 'fbt-runtime'
import get from 'lodash.get'

import { setEmailAttestation } from 'actions/Onboarding'
import OriginButton from 'components/origin-button'
import PinInput from 'components/pin-input'
import withOnboardingSteps from 'hoc/withOnboardingSteps'
import withConfig from 'hoc/withConfig'
import OnboardingStyles from 'styles/onboarding'

class EmailScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      emailValue: '',
      emailError: '',
      loading: false,
      verify: false,
      verifyError: '',
      verificationCode: ''
    }
  }

  componentDidMount() {
    // Override the back button functionality in header
    this.props.navigation.setParams({
      handleBack: this.handleBack.bind(this)
    })
  }

  handleChange = async emailValue => {
    await this.setState({ emailError: '', emailValue })
  }

  /* Override the back function because of the verify step being present on this
   * screen and not on a separate route.
   */
  handleBack = () => {
    this.state.verify
      ? this.setState({ verify: false })
      : this.props.navigation.goBack(null)
  }

  /* Handle submission of email. Check if an identity with this phone
   * number exists, and if so redirect to a warning. Otherwise generate a
   * verification code and email it to the user.
   */
  handleSubmitEmail = async () => {
    // Naive/simple email regex but should catch most issues
    const emailPattern = /.+@.+\..+/
    if (!emailPattern.test(this.state.emailValue)) {
      this.setState({
        emailError: String(
          fbt(
            'That does not look like a valid email.',
            'EmailScreen.invalidEmail'
          )
        )
      })
      return
    }

    this.setState({ loading: true })

    if (!this.props.onboarding.noRewardsDismissed) {
      // Check if account exists
      const exists = await this.checkDuplicateIdentity()
      if (exists) {
        this.setState({ loading: false })
        this.props.navigation.navigate('ImportWarning', {
          // Call this function again on return from import warning
          onGoBack: () => this.handleSubmitEmail()
        })
        return
      }
    }

    const response = await this.generateVerificationCode()
    if (response.ok) {
      this.setState({ loading: false, verify: true })
    } else {
      const data = await response.json()
      this.setState({
        loading: false,
        emailError: get(data, 'errors[0]', '')
      })
    }
  }

  /* Send a request to @origin/bridge looking for a duplicate for this email
   */
  checkDuplicateIdentity = async () => {
    const url = `${this.props.config.bridge}/utils/exists`
    const response = await fetch(url, {
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        email: this.state.emailValue
      })
    })
    // 200 status code indicates account was found
    return response.status === 200
  }

  /* Request a verification code from @origin/bridge
   */
  generateVerificationCode = async () => {
    const url = `${
      this.props.config.bridge
    }/api/attestations/email/generate-code`
    return await fetch(url, {
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ email: this.state.emailValue })
    })
  }

  /* Handle submission of the verification code. Send it to @origin/bridge and
   * store the resulting attestation, or display an error.
   */
  handleSubmitVerification = async () => {
    this.setState({ loading: true })
    const url = `${this.props.config.bridge}/api/attestations/email/verify`
    const response = await fetch(url, {
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({
        code: this.state.verificationCode,
        identity: this.props.wallet.activeAccount.address,
        email: this.state.emailValue
      })
    })

    const data = await response.json()
    this.setState({ loading: false })
    if (!response.ok) {
      this.setState({ verifyError: get(data, 'errors[0]', '') })
    } else {
      this.props.setEmailAttestation(data)
      this.props.navigation.navigate(this.props.nextOnboardingStep)
    }
  }

  render() {
    return (
      <KeyboardAvoidingView
        style={styles.onboardingDarkOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            style={styles.onboardingModal}
            contentContainerStyle={styles.content}
          >
            {!this.state.verify ? this.renderInput() : this.renderVerify()}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    )
  }

  /* Render the email input.
   */
  renderInput() {
    return (
      <>
        <View style={{ ...styles.container, justifyContent: 'flex-start' }}>
          <Text style={styles.title}>
            <fbt desc="EmailScreen.inputTitle">Let&apos;s get started</fbt>
          </Text>
          <Text style={styles.subtitle}>
            <fbt desc="EmailScreen.inputSubtitle">
              What&apos;s your email address?
            </fbt>
          </Text>
        </View>
        <View style={{ ...styles.container, justifyContent: 'center' }}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
            multiline={false}
            keyboardType="email-address"
            returnKeyType="next"
            onChangeText={this.handleChange}
            onSubmitEditing={this.handleSubmitEmail}
            value={this.state.emailValue}
            style={[styles.input, this.state.emailError ? styles.invalid : {}]}
          />
          {this.state.emailError.length > 0 && (
            <Text style={styles.invalid}>{this.state.emailError}</Text>
          )}
          <View style={styles.legalContainer}>
            <Text style={styles.legal}>
              <fbt desc="EmailScreen.inputHelpText">
                We will use your email to notify you of important notifications
                when you buy or sell.
              </fbt>
            </Text>
          </View>
        </View>
        <View style={{ ...styles.container, justifyContent: 'flex-end' }}>
          {this.renderVisibilityWarning()}
          <OriginButton
            size="large"
            type="primary"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={fbt('Continue', 'EmailScreen.continueButton')}
            disabled={
              !this.state.emailValue.length ||
              this.state.emailError ||
              this.state.loading
            }
            onPress={this.handleSubmitEmail}
            loading={this.state.loading}
          />
        </View>
      </>
    )
  }

  /* Render the input for the verification code.
   */
  renderVerify() {
    return (
      <>
        <View style={{ ...styles.container, justifyContent: 'flex-start' }}>
          <Text style={styles.title}>
            <fbt desc="EmailScreen.verifyTitle">Verify your email</fbt>
          </Text>
          <Text style={styles.subtitle}>
            <fbt desc="EmailScreen.verifySubtitle">Enter code</fbt>
          </Text>
        </View>
        <View style={{ ...styles.container, justifyContent: 'flex-center' }}>
          <PinInput
            value={this.state.verificationCode}
            pinLength={6}
            onChangeText={async value => {
              await this.setState({
                verificationCode: value.substr(0, 6),
                verifyError: ''
              })
              if (this.state.verificationCode.length === 6) {
                this.handleSubmitVerification()
              }
            }}
            onSubmitEditing={() => this.handleSubmitVerification}
          />
          {this.state.verifyError.length > 0 && (
            <Text style={styles.invalid}>{this.state.verifyError}</Text>
          )}
          <View style={styles.legalContainer}>
            <Text style={styles.legal}>
              <fbt desc="EmailScreen.verifyHelpText">
                We sent you a code to the email address you provided. Please
                enter it above.
              </fbt>
            </Text>
          </View>
        </View>
        <View style={{ ...styles.container, justifyContent: 'flex-end' }}>
          {this.renderVisibilityWarning()}
          <OriginButton
            size="large"
            type="primary"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={fbt('Verify', 'EmailScreen.verifyButton')}
            disabled={
              this.state.verificationCode.length < 6 ||
              this.state.verifyError ||
              this.state.loading
            }
            onPress={this.handleSubmitVerification}
            loading={this.state.loading}
          />
        </View>
      </>
    )
  }

  renderVisibilityWarning() {
    return (
      <View style={styles.visibilityWarningContainer}>
        <Text style={styles.visibilityWarningHeader}>
          <fbt desc="EmailScreen.visibilityWarningHeader">
            What will be visible on the blockchain?
          </fbt>
        </Text>
        <Text style={styles.visibilityWarningText}>
          <fbt desc="AvatarScreen.visibilityWarningText">
            That you have a verified email, but NOT your actual email address.
          </fbt>
        </Text>
      </View>
    )
  }
}

const mapStateToProps = ({ onboarding, wallet }) => {
  return { onboarding, wallet }
}

const mapDispatchToProps = dispatch => ({
  setEmailAttestation: emailAttestation =>
    dispatch(setEmailAttestation(emailAttestation))
})

export default withConfig(
  withOnboardingSteps(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(EmailScreen)
  )
)

const styles = StyleSheet.create({
  ...OnboardingStyles
})
