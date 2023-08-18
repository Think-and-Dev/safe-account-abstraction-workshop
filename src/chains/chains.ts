import Chain from 'src/models/chain'

export const mumbaiChain: Chain = {
  id: '0x13881',
  token: 'matic',
  shortName: 'matic',
  label: 'Mumbai',
  rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
  blockExplorerUrl: 'https://mumbai.polygonscan.com',
  color: '#8248E5',
  isStripePaymentsEnabled: true,
  faucetUrl: 'https://mumbaifaucet.com/'
}

const chains: Chain[] = [mumbaiChain]
export const initialChain = mumbaiChain

export default chains