// components/TooltipWrapper.jsx
import * as Tooltip from '@radix-ui/react-tooltip'

export default function TooltipWrapper({ children, label }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            className="bg-black text-white text-xs px-2 py-1 rounded-md shadow-sm z-50"
          >
            {label}
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
