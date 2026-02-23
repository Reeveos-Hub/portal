/**
 * Run 1: Payments (from UXPilot page 9 — combined with Analytics)
 * Placeholder content — wire up in Run 9
 */

import Card from '../../components/shared/Card'

const Payments = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Payments</h1>
        <p className="text-muted">
          Stripe Connect, deposits, transaction history, and payouts
        </p>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[#F3F0E8] flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-credit-card text-2xl text-primary" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-primary mb-2">Payments & Payouts</h2>
          <p className="text-muted text-sm">
            Connect Stripe, manage deposits, view transaction history, and track payouts.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Payments
