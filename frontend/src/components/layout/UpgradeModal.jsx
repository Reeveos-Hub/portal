/**
 * Run 1: Shown when clicking a locked nav item
 */

const UpgradeModal = ({ tierName, message, onClose, onViewPlans }) => {
  const displayMessage = message || `This feature is available on the ${tierName} plan and above.`
  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl max-w-[380px] w-full p-8 shadow-xl pointer-events-auto"
          role="dialog"
          aria-labelledby="upgrade-modal-title"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F3F0E8] flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-lock text-primary text-xl" />
          </div>
          <h2 id="upgrade-modal-title" className="font-heading text-xl font-bold text-primary text-center mb-2">
            Upgrade to {tierName}
          </h2>
          <p className="text-muted text-sm text-center mb-6">
            {displayMessage}
          </p>
          <button
            onClick={onViewPlans}
            className="w-full py-3 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
          >
            View Plans
          </button>
          <button
            onClick={onClose}
            className="w-full mt-3 text-sm text-muted hover:text-main transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </>
  )
}

export default UpgradeModal
