export type UnauthorizedAction = 'ignore' | 'end-session' | 'replay' | 'refresh';
export type RefreshOutcome = 'refreshed' | 'rejected' | 'unreachable';
export type AfterRefreshAction = 'ignore' | 'end-session' | 'replay';

export function decideOnUnauthorized(input: {
  isAuthCall: boolean;
  alreadyRetried: boolean;
  hasSession: boolean;
  sentToken: string | null | undefined;
  currentToken: string | null | undefined;
}): UnauthorizedAction;

export function decideAfterRefresh(outcome: RefreshOutcome): AfterRefreshAction;
