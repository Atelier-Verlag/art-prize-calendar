import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export function FloatingAdminButton() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only show for logged-in users
  if (!user) return null;

  return (
    <Button
      onClick={() => navigate('/admin')}
      className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg rounded-full h-14 px-6 font-bold text-base"
    >
      <Shield className="h-5 w-5 mr-2" />
      Go to Admin
    </Button>
  );
}