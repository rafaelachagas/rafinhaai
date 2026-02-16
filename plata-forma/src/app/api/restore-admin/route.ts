import { NextRequest, NextResponse } from 'next/server';
import { restoreMasterAccess } from '@/app/actions/admin';

export async function GET(req: NextRequest) {
    const result = await restoreMasterAccess();
    if (result.success) {
        return NextResponse.json({ message: 'Acesso restaurado com sucesso! Você pode voltar ao dashboard.' });
    } else {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }
}
