import { NextRequest, NextResponse } from 'next/server';
import { restoreMasterAccess } from '@/app/actions/admin';

export async function GET(req: NextRequest) {
    const result = await restoreMasterAccess();
    if (result.success) {
        return NextResponse.json({ message: 'Acesso restaurado com sucesso! RECARREGUE A PÁGINA (F5) no seu dashboard para as travas de segurança entrarem em vigor.' });
    } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }
}
