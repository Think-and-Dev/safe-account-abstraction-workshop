import AccountAbstraction from '@safe-global/account-abstraction-kit-poc'
import { Web3AuthModalPack } from '@safe-global/auth-kit'

import { GelatoRelayPack } from '@safe-global/relay-kit'

import { MetaTransactionData, MetaTransactionOptions } from '@safe-global/safe-core-sdk-types'

import { ethers, utils } from 'ethers'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { initialChain } from 'src/chains/chains'
import usePolling from 'src/hooks/usePolling'
import Chain from 'src/models/chain'
import getChain from 'src/utils/getChain'
import { getModalConfig, getOpenLoginAdapter, getWeb3AuthOptions } from '../utils/web3Auth'

type accountAbstractionContextValue = {
  ownerAddress?: string
  chainId: string
  safes: string[]
  chain?: Chain
  isAuthenticated: boolean
  web3Provider?: ethers.providers.Web3Provider
  loginWeb3Auth: () => void
  logoutWeb3Auth: () => void
  setChainId: (chainId: string) => void
  safeSelected?: string
  safeBalance?: string
  setSafeSelected: React.Dispatch<React.SetStateAction<string>>
  isRelayerLoading: boolean
  relayTransaction: (addressTo: string) => Promise<void>
  gelatoTaskId?: string
}

const initialState = {
  isAuthenticated: false,
  loginWeb3Auth: () => {},
  logoutWeb3Auth: () => {},
  relayTransaction: async () => {},
  setChainId: () => {},
  setSafeSelected: () => {},
  onRampWithStripe: async () => {},
  safes: [],
  chainId: initialChain.id,
  isRelayerLoading: true,
  openStripeWidget: async () => {}
}

const accountAbstractionContext = createContext<accountAbstractionContextValue>(initialState)

const useAccountAbstraction = () => {
  const context = useContext(accountAbstractionContext)
  if (!context) {
    throw new Error('useAccountAbstraction should be used within a AccountAbstraction Provider')
  }
  return context
}

const AccountAbstractionProvider = ({ children }: { children: JSX.Element }) => {
  // owner address from the email  (provided by web3Auth)
  const [ownerAddress, setOwnerAddress] = useState<string>('')
  // safes owned by the user
  const [safes, setSafes] = useState<string[]>([])
  // chain selected
  const [chainId, setChainId] = useState<string>(initialChain.id)
  // web3 provider to perform signatures
  const [web3Provider, setWeb3Provider] = useState<ethers.providers.Web3Provider>()
  const isAuthenticated = !!ownerAddress && !!chainId
  const chain = getChain(chainId) || initialChain

  const resetStateComponent = () => {
    setOwnerAddress('')
    setSafes([])
    setChainId(chain.id)
    setWeb3Provider(undefined)
    setSafeSelected('')
  }

  // reset React state when you switch the chain
  useEffect(() => {
    resetStateComponent()
  }, [chain])

  // authClient
  const [web3AuthModalPack, setWeb3AuthModalPack] = useState<Web3AuthModalPack>()

  // auth-kit implementation
  const loginWeb3Auth = useCallback(async () => {
    try {
      const options = getWeb3AuthOptions(chain)

      const modalConfig = getModalConfig()

      const openloginAdapter = getOpenLoginAdapter()

      const web3AuthModalPack = new Web3AuthModalPack({
        txServiceUrl: chain.transactionServiceUrl
      })

      await web3AuthModalPack.init({
        options,
        adapters: [openloginAdapter],
        modalConfig
      })

      if (web3AuthModalPack) {
        const { safes, eoa } = await web3AuthModalPack.signIn()
        const provider = web3AuthModalPack.getProvider() as ethers.providers.ExternalProvider

        // we set react state with the provided values: owner (eoa address), chain, safes owned & web3 provider
        setChainId(chain.id)
        setOwnerAddress(eoa)
        setSafes(safes || [])
        setWeb3Provider(new ethers.providers.Web3Provider(provider))
        setWeb3AuthModalPack(web3AuthModalPack)
      }
    } catch (error) {
      console.log('error: ', error)
    }
  }, [chain])

  const logoutWeb3Auth = () => {
    web3AuthModalPack?.signOut()
    setOwnerAddress('')
    setSafes([])
    setChainId(chain.id)
    setWeb3Provider(undefined)
    setSafeSelected('')
    setGelatoTaskId(undefined)
  }

  // current safe selected by the user
  const [safeSelected, setSafeSelected] = useState<string>('')

  // conterfactual safe Address if its not deployed yet
  useEffect(() => {
    const getSafeAddress = async () => {
      if (web3Provider) {
        const signer = web3Provider.getSigner()
        const relayPack = new GelatoRelayPack()
        const safeAccountAbstraction = new AccountAbstraction(signer)
        await safeAccountAbstraction.init({ relayPack })
        const hasSafes = safes.length > 0
        const safeSelected = hasSafes ? safes[0] : await safeAccountAbstraction.getSafeAddress()

        setSafeSelected(safeSelected)
      }
    }

    getSafeAddress()
  }, [safes, web3Provider])

  const [isRelayerLoading, setIsRelayerLoading] = useState<boolean>(false)
  const [gelatoTaskId, setGelatoTaskId] = useState<string>()

  // refresh the Gelato task id
  useEffect(() => {
    setIsRelayerLoading(false)
    setGelatoTaskId(undefined)
  }, [chainId])

  // relay-kit implementation using Gelato
  const relayTransaction = async (addressTo: string) => {
    if (web3Provider) {
      setIsRelayerLoading(true)

      const signer = web3Provider.getSigner()
      const relayPack = new GelatoRelayPack()
      const safeAccountAbstraction = new AccountAbstraction(signer)
      await safeAccountAbstraction.init({ relayPack })

      // we use a dump safe transfer as a demo transaction
      const dumpSafeTransafer: MetaTransactionData[] = [
        {
          to: addressTo,
          data: '0x',
          value: utils.parseUnits('0.01', 'ether').toString(),
          operation: 0 // OperationType.Call,
        }
      ]

      const options: MetaTransactionOptions = {
        isSponsored: false,
        gasLimit: '600000', // in this alfa version we need to manually set the gas limit
        gasToken: ethers.constants.AddressZero // native token
      }

      const gelatoTaskId = await safeAccountAbstraction.relayTransaction(dumpSafeTransafer, options)
      setIsRelayerLoading(false)
      setGelatoTaskId(gelatoTaskId)
    }
  }

  // fetch safe address balance with polling
  const fetchSafeBalance = useCallback(async () => {
    const balance = await web3Provider?.getBalance(safeSelected)
    return balance?.toString()
  }, [web3Provider, safeSelected])

  const safeBalance = usePolling(fetchSafeBalance)

  const state = {
    ownerAddress,
    chainId,
    chain,
    safes,
    isAuthenticated,
    web3Provider,
    loginWeb3Auth,
    logoutWeb3Auth,
    setChainId,
    safeSelected,
    safeBalance,
    setSafeSelected,
    isRelayerLoading,
    relayTransaction,
    gelatoTaskId
  }

  return (
    <accountAbstractionContext.Provider value={state}>
      {children}
    </accountAbstractionContext.Provider>
  )
}

export { useAccountAbstraction, AccountAbstractionProvider }