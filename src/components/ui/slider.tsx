import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number[]
  defaultValue?: number[]
  max?: number
  min?: number
  step?: number
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, defaultValue = [0], max = 100, min = 0, step = 1, onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const currentValue = value ?? internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [Number(e.target.value)]
      setInternalValue(newValue)
      onValueChange?.(newValue)
    }

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue[0]}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-lg"
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }