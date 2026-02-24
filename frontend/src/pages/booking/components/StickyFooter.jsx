/**
 * Contained sticky footer for booking CTA
 * Stays at bottom of scroll context, max-width matches container
 */

const StickyFooter = ({ children }) => (
  <div className="pt-4 pb-6 sm:pt-5 sm:pb-8 bg-[#FEFBF4]">
    {children}
  </div>
)

export default StickyFooter
