import { Users } from 'lucide-react';
import { Breadcrumb } from '../../_components/breadcrumb';

export default function EndUsersBreadcrumbs() {
  return (
    <Breadcrumb
      href="/admin/end-users"
      image={null}
      name="End Users"
      Fallback={Users}
      mobileHideText
    />
  );
}
