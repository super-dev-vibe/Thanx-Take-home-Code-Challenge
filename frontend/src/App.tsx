import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Snackbar,
  Pagination,
  Switch,
  FormControlLabel,
} from '@mui/material'

const API_BASE = '/api'
const DEMO_USER_ID = 1
const HISTORY_PAGE_SIZE = 5

function getTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
  })
}

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
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })
  const [historyPage, setHistoryPage] = useState(1)
  const [darkMode, setDarkMode] = useState(false)
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode])

  const showToast = useCallback((message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity })
  }, [])

  const closeToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }))
  }, [])

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

  const historyTotalPages = Math.max(1, Math.ceil(redemptions.length / HISTORY_PAGE_SIZE))
  const historyPageClamped = Math.min(historyPage, historyTotalPages)

  useEffect(() => {
    if (historyPage > historyTotalPages) setHistoryPage(1)
  }, [redemptions.length, historyPage, historyTotalPages])

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
        const msg = data?.errors?.join(', ') || 'Redemption failed'
        setError(msg)
        showToast(msg.includes('points') ? "Failed: you don't have enough points." : msg, 'error')
        return
      }
      if (!data || data.new_balance == null) {
        setError('Invalid response from server')
        showToast('Invalid response from server', 'error')
        return
      }
      const rewardName = data.reward_name ?? 'Reward'
      const cost = data.points_cost ?? 0
      setPoints((p) => (p ? { ...p, points_balance: data.new_balance! } : null))
      setRedemptions((prev) => [
        {
          id: data.id ?? 0,
          reward_id: rewardId,
          reward_name: rewardName,
          points_cost: cost,
          redeemed_at: data.redeemed_at ?? new Date().toISOString(),
        },
        ...prev,
      ])
      showToast(`Successfully redeemed ${rewardName} – ${cost} pts`, 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      setError(msg)
      showToast(msg, 'error')
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
        showToast(msg, 'error')
        return
      }
      if (data?.points_balance != null) {
        setPoints((p) => (p ? { ...p, points_balance: data.points_balance! } : null))
        showToast('Successfully added 500 points', 'success')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      setError(msg)
      showToast(msg, 'error')
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
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            Loyalty Rewards
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={(_, checked) => setDarkMode(checked)}
                color="default"
                size="small"
              />
            }
            label={<Typography variant="body2" color="inherit">Invert</Typography>}
            sx={{ mr: 1 }}
            labelPlacement="start"
          />
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

      <Container maxWidth="sm" component="main" sx={{ pt: 10, pb: 3 }}>
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
          <>
            <List dense>
              {redemptions
                .slice((historyPageClamped - 1) * HISTORY_PAGE_SIZE, historyPageClamped * HISTORY_PAGE_SIZE)
                .map((r) => (
                  <ListItem key={r.id} divider>
                    <ListItemText
                      primary={`${r.reward_name} (${r.points_cost} pts)`}
                      secondary={new Date(r.redeemed_at).toLocaleString()}
                    />
                  </ListItem>
                ))}
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={historyTotalPages}
                page={historyPageClamped}
                onChange={(_, page) => setHistoryPage(page)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          </>
        )}
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}

export default App
