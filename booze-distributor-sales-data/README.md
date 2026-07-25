# Booze Distributor Sales Data

Prototype for normalising retailer sell-out files and forecasting when a distributor should expect the next replenishment order.

It assumes messy CSV/Excel/portal exports become row objects before this lane. The core decision surface is simple: normalised velocity, days of cover, reorder risk and exception alerts.
