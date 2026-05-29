import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { StudioConcierge } from './StudioConcierge';
import { SessionInitialization } from './SessionInitialization';

/**
 * Sovereign Dashboard acts as the Studio Floor.
 * Serves the Domain Selection Matrix instead of raw lists.
 */
export default function SovereignDashboard() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainTitle, setDomainTitle] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (id: string, name: string) => {
    setSelectedDomain(id);
    setDomainTitle(name);
    setIsInitializing(true);

    // After 1500ms, "arrive" at the Workflow
    setTimeout(() => {
      setIsInitializing(false);
      navigate(`/workflow/${id}`);
    }, 1500);
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-[#050505]">
        <AnimatePresence>
          {!selectedDomain && (
            <StudioConcierge onSelect={handleSelect} />
          )}

          {isInitializing && domainTitle && (
            <SessionInitialization domainName={domainTitle} />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
