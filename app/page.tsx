import { Suspense } from 'react';
import AppContainer from '@/components/AppContainer';

export default function Home() {
    return (
        <main>
            <Suspense fallback={<div>Loading...</div>}>
                <AppContainer />
            </Suspense>
        </main>
    );
}
