import styled from '@emotion/styled'
import { Theme } from '@mui/material'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import ConnectedWalletLabel from 'src/components/connected-wallet-label/ConnectedWalletLabel'
import SafeInfo from 'src/components/safe-info/SafeInfo'
import { useAccountAbstraction } from 'src/store/accountAbstractionContext'

const AuthKitDemo = () => {
  const { loginWeb3Auth, isAuthenticated, safeSelected, chainId } = useAccountAbstraction()

  return (
    <>
      <Typography variant="h2" component="h1">
        The Auth Kit
      </Typography>

      <Divider style={{ margin: '32px 0 28px 0' }} />

      {isAuthenticated ? (
        <Box display="flex" gap={3}>
          {/* safe Account */}
          <ConnectedContainer>
            <Typography fontWeight="700">Safe Account</Typography>
            <Typography fontSize="14px" marginTop="8px" marginBottom="32px">
              Your Safe account (Smart Contract) holds and protects your assets.
            </Typography>
            {safeSelected && <SafeInfo safeAddress={safeSelected} chainId={chainId} />}
          </ConnectedContainer>

          <ConnectedContainer>
            <Typography fontWeight="700">Owner ID</Typography>
            <Typography fontSize="14px" marginTop="8px" marginBottom="32px">
              Your Owner account signs transactions to unlock your assets.
            </Typography>
            <ConnectedWalletLabel />
          </ConnectedContainer>
        </Box>
      ) : (
        <ConnectContainer display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="h4" component="h3" fontWeight="700">
            Create a safe using the Auth Kit
          </Typography>

          <Button variant="contained" onClick={loginWeb3Auth}>
            Connect
          </Button>
        </ConnectContainer>
      )}

      <Divider style={{ margin: '40px 0 30px 0' }} />
    </>
  )
}

export default AuthKitDemo

const ConnectContainer = styled(Box)<{
  theme?: Theme
}>(
  ({ theme }) => `
  
  border-radius: 10px;
  border: 1px solid ${theme.palette.border.light};
  padding: 50px;
`
)

const ConnectedContainer = styled(Box)<{
  theme?: Theme
}>(
  ({ theme }) => `
  
  border-radius: 10px;
  border: 1px solid ${theme.palette.border.light};
  padding: 40px 32px;
`
)