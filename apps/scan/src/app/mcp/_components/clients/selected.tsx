import Image from 'next/image';

import { clients } from './data';

import type { Clients as ClientsEnum } from './data';

interface Props {
  client: ClientsEnum;
}

export const SelectedClient: React.FC<Props> = ({ client }) => {
  const { image, name } = clients[client];

  return (
    <div>
      <Image src={image} alt={name} width={20} height={20} />
    </div>
  );
};
