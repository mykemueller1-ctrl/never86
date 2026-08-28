import { cookies } from 'next/headers';
import { OPERATOR_COOKIE, verifyOperatorSession, type OperatorSession } from './operatorSession';

export async function readOperatorSession(): Promise<OperatorSession | null> {
  const token = (await cookies()).get(OPERATOR_COOKIE)?.value;
  return verifyOperatorSession(token, Date.now());
}
