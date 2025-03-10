"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface AreaChartProps {
  data: Array<{
    date: string
    amount: number
  }>
}

export function AreaChartComponent({ data }: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(parseISO(date), "d MMM", { locale: es })}
          className="text-xs text-muted-foreground"
        />
        <YAxis
          tickFormatter={(value) =>
            new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(value)
          }
          className="text-xs text-muted-foreground"
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Fecha
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {format(parseISO(label), "d MMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Total
                      </span>
                      <span className="font-bold">
                        {new Intl.NumberFormat("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        }).format(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#0ea5e9"
          fillOpacity={1}
          fill="url(#colorAmount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
} 