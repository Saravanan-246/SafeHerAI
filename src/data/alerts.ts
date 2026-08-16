export type AlertType = "warning" | "success" | "danger";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  time: string;
  location?: string;
}

/*
 * No fabricated alert data.
 *
 * Real alerts would require integration with a
 * verified, real-time safety or civic incident
 * feed (e.g. police open-data API, verified
 * community reports).  No such source is
 * currently connected.
 *
 * The AlertsScreen already renders an honest
 * "nothing to review" empty state when this
 * array is empty.
 */
export const alerts: Alert[] = [];