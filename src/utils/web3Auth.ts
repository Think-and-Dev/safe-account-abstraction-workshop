import { Web3AuthOptions } from '@web3auth/modal'
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base'
import Chain from '../models/chain'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'

export const getWeb3AuthOptions = (chain: Chain) => {
  const options: Web3AuthOptions = {
    clientId: process.env.REACT_APP_WEB3AUTH_CLIENT_ID || '',
    web3AuthNetwork: 'testnet',
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: chain.id,
      rpcTarget: chain.rpcUrl
    },
    uiConfig: {
      theme: 'dark',
      loginMethodsOrder: ['google', 'facebook']
    }
  }

  return options
}

export const getModalConfig = () => {
  return {
    [WALLET_ADAPTERS.METAMASK]: {
      label: 'metamask',
      showOnDesktop: true,
      showOnMobile: false
    }
  }
}

export const getOpenLoginAdapter = () => {
  return new OpenloginAdapter({
    loginSettings: {
      mfaLevel: 'mandatory'
    },
    adapterSettings: {
      uxMode: 'popup',
      whiteLabel: {
        name: 'Safe'
      }
    }
  })
}