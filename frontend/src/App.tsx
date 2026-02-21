import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from '@mui/material'

const API_BASE = '/api'
const DEMO_USER_ID = 1

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
})

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid response from server')
  }
}

type PointsBalance = { user_id: number; points_balance: number }
type Reward = { id: number; name: string; points_cost: number; description: string | null }
type Redemption = {
  id: number
  reward_id: number
  reward_name: string
  points_cost: number
  redeemed_at: string
}

function App() {
  const [points, setPoints] = useState<PointsBalance | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const [topUpLoading, setTopUpLoading] = useState(false)

  const fetchPoints = useCallback(async () => {
    const res = await fetch(`${API_BASE}/users/${DEMO_USER_ID}/points`)
    if (!res.ok) throw new Error('Failed to fetch points')
    const data = await parseJson(res) as PointsBalance
    setPoints(data)
  }, [])

  const fetchRewards = useCallback(async () => {
    const res = await fetch(`${API_BASE}/rewards`)
    if (!res.ok) throw new Error('Failed to fetch rewards')
    const data = await parseJson(res) as Reward[]
    setRewards(data)
  }, [])

  const fetchRedemptions = useCallback(async () => {
    const res = await fetch(`${API_BASE}/users/${DEMO_USER_ID}/redemptions`)
    if (!res.ok) throw new Error('Failed to fetch redemptions')
    const data = await parseJson(res) as Redemption[]
    setRedemptions(data ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all([fetchPoints(), fetchRewards(), fetchRedemptions()])
      .then(() => { if (!cancelled) setLoading(false) })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : 'Error'); setLoading(false) } })
    return () => { cancelled = true }
  }, [fetchPoints, fetchRewards, fetchRedemptions])

  const redeem = async (rewardId: number) => {
    setRedeemingId(rewardId)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/users/${DEMO_USER_ID}/redemptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemption: { reward_id: rewardId } }),
      })
      const data = await parseJson(res) as { errors?: string[]; new_balance?: number; id?: number; reward_name?: string; points_cost?: number; redeemed_at?: string } | null
      if (!res.ok) {
        setError(data?.errors?.join(', ') || 'Redemption failed')
        return
      }
      if (!data || data.new_balance == null) {
        setError('Invalid response from server')
        return
      }
      setPoints((p) => (p ? { ...p, points_balance: data.new_balance! } : null))
      setRedemptions((prev) => [
        {
          id: data.id ?? 0,
          reward_id: rewardId,
          reward_name: data.reward_name ?? '',
          points_cost: data.points_cost ?? 0,
          redeemed_at: data.redeemed_at ?? new Date().toISOString(),
        },
        ...prev,
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setRedeemingId(null)
    }
  }

  const topUp = async (amount: number) => {
    setTopUpLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: DEMO_USER_ID, points: amount }),
      })
      const data = await parseJson(res) as { points_balance?: number; errors?: string[]; error?: string } | null
      if (!res.ok) {
        const msg = data?.errors?.length ? data.errors.join(', ') : data?.error ?? 'Top-up failed'
        setError(msg)
        return
      }
      if (data?.points_balance != null) {
        setPoints((p) => (p ? { ...p, points_balance: data.points_balance! } : null))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setTopUpLoading(false)
    }
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            Loyalty Rewards
          </Typography>
          {points !== null && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Your balance: <strong>{points.points_balance}</strong> points
              </Typography>
              <Button
                color="inherit"
                variant="outlined"
                size="small"
                onClick={() => topUp(500)}
                disabled={topUpLoading}
              >
                {topUpLoading ? '…' : '+500 points'}
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Available rewards
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {rewards.map((r) => (
            <Card key={r.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {r.name} — {r.points_cost} pts
                </Typography>
                {r.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {r.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => redeem(r.id)}
                  disabled={redeemingId === r.id || (points?.points_balance ?? 0) < r.points_cost}
                >
                  {redeemingId === r.id ? 'Redeeming…' : 'Redeem'}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Redemption history
        </Typography>
        {redemptions.length === 0 ? (
          <Typography color="text.secondary">No redemptions yet.</Typography>
        ) : (
          <List dense>
            {redemptions.map((r) => (
              <ListItem key={r.id} divider>
                <ListItemText
                  primary={`${r.reward_name} (${r.points_cost} pts)`}
                  secondary={new Date(r.redeemed_at).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Container>
    </ThemeProvider>
  )
}

export default App
