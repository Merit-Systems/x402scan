'use client';

import { useState, useEffect } from 'react';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { api } from '@/trpc/client';
import type { PartnerData as DbPartnerData } from '@x402scan/partners-db';

export interface PartnerData {
  partnerName: string;
  partnerMeritContact: string;
  partnerEmail: string;
  partnerOrganization: string;
}

interface PartnerCollapsibleProps {
  onPartnerChange?: (data: PartnerData) => void;
}

export const PartnerCollapsible = ({
  onPartnerChange,
}: PartnerCollapsibleProps) => {
  const [open, setOpen] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerMeritContact, setPartnerMeritContact] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerOrganization, setPartnerOrganization] = useState('');
  const [searchPartner, setSearchPartner] = useState('');

  // Parse merit contacts from env var (comma-separated)
  const meritContacts = [
    'Sam',
    'Ryan',
    'Alvaro',
    'Jason',
    'Ben',
    'Shafu',
    'Mason',
    'Mitch',
  ];

  // Search partners by name - only when collapsible is closed (searching existing partners)
  const searchQuery = api.admin.partners.search.useQuery(
    { searchTerm: searchPartner },
    { enabled: searchPartner.length > 0 && !open }
  );
  const searchResults: DbPartnerData[] | undefined = searchQuery.data;

  // Update parent when partner data changes
  useEffect(() => {
    if (onPartnerChange) {
      onPartnerChange({
        partnerName,
        partnerMeritContact,
        partnerEmail,
        partnerOrganization,
      });
    }
  }, [
    partnerName,
    partnerMeritContact,
    partnerEmail,
    partnerOrganization,
    onPartnerChange,
  ]);

  const clearAllFields = () => {
    setPartnerName('');
    setPartnerMeritContact('');
    setPartnerEmail('');
    setPartnerOrganization('');
    setSearchPartner('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // Closing - clear all fields only if they were manually entered (not from search)
      // If searchPartner has a value, keep it
      if (!searchPartner) {
        clearAllFields();
      } else {
        // Keep search but clear form fields
        setPartnerName('');
        setPartnerMeritContact('');
        setPartnerEmail('');
        setPartnerOrganization('');
      }
    }
    setOpen(newOpen);
  };

  const handleSelectPartner = (partner: DbPartnerData) => {
    setPartnerName(partner.name);
    setPartnerEmail(partner.email ?? '');
    setPartnerOrganization(partner.organization ?? '');
    setPartnerMeritContact(partner.merit_contact ?? '');
    setSearchPartner(partner.name);
    // Close the dropdown by clearing search temporarily, then set it back
    // Auto-open collapsible to show the selected partner's data
    setOpen(true);
  };

  const handleNewPartner = () => {
    // Clear search and open collapsible for new partner entry
    setSearchPartner('');
    setOpen(true);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="space-y-2"
    >
      <Label>Partner (Optional)</Label>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Search partner..."
              value={searchPartner}
              onChange={e => setSearchPartner(e.target.value)}
              className="w-full"
            />
            {searchPartner &&
              !open &&
              searchResults &&
              searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                  {searchResults.map(partner => (
                    <button
                      key={partner.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleSelectPartner(partner)}
                    >
                      <div className="font-medium">{partner.name}</div>
                      {partner.organization && (
                        <div className="text-xs text-muted-foreground">
                          {partner.organization}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
          </div>
          <Button
            type="button"
            variant={open ? 'destructive' : 'outline'}
            onClick={open ? () => setOpen(false) : handleNewPartner}
          >
            {open ? (
              'Cancel'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New
              </>
            )}
          </Button>
        </div>
      </div>

      <CollapsibleContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label htmlFor="partnerName">Partner Name (Optional)</Label>
          <Input
            id="partnerName"
            placeholder="John Doe"
            value={partnerName}
            onChange={e => setPartnerName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Partner will be created automatically if it doesn&apos;t exist
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="partnerMeritContact">Merit Contact (Optional)</Label>
          {meritContacts.length > 0 ? (
            <Select
              value={partnerMeritContact}
              onValueChange={setPartnerMeritContact}
            >
              <SelectTrigger id="partnerMeritContact" className="w-full">
                <SelectValue placeholder="Select a Merit contact" />
              </SelectTrigger>
              <SelectContent>
                {meritContacts.map(contact => (
                  <SelectItem key={contact} value={contact}>
                    {contact}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="partnerMeritContact"
              placeholder="Contact name at Merit"
              value={partnerMeritContact}
              onChange={e => setPartnerMeritContact(e.target.value)}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Name of the Merit team member managing this partner
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="partnerEmail">Partner Email (Optional)</Label>
          <Input
            id="partnerEmail"
            type="email"
            placeholder="partner@example.com"
            value={partnerEmail}
            onChange={e => setPartnerEmail(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Partner email address. Will use placeholder if not provided.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="partnerOrganization">
            Partner Organization (Optional)
          </Label>
          <Input
            id="partnerOrganization"
            placeholder="Acme Inc"
            value={partnerOrganization}
            onChange={e => setPartnerOrganization(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Partner organization name. Will use placeholder if not provided.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
