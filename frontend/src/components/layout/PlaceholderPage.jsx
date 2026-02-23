/**
 * Run 1: Placeholder for unbuilt features
 */

const PlaceholderPage = ({ title, icon, description, requiredTier }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
    <div className="w-16 h-16 rounded-2xl bg-[#F3F0E8] flex items-center justify-center mb-4">
      <i className={`fa-solid ${icon} text-2xl text-primary`} />
    </div>
    <h2 className="font-heading text-xl font-bold text-primary mb-2">{title}</h2>
    <p className="text-muted text-sm text-center max-w-md">
      {description}
      {requiredTier ? (
        <span className="block mt-2">
          This feature requires {requiredTier} plan or above.
        </span>
      ) : null}
    </p>
  </div>
)

export default PlaceholderPage
