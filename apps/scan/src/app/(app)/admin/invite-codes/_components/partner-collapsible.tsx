'use client';

import { useState } from 'react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

export const PartnerCollapsible = () => {
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

    const clearAllFields = () => {
        setPartnerName('');
        setPartnerMeritContact('');
        setPartnerEmail('');
        setPartnerOrganization('');
        setSearchPartner('');
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen && open) {
            // Closing - clear all fields
            clearAllFields();
        }
        setOpen(newOpen);
    };

    return (
        <Collapsible
            open={open}
            onOpenChange={handleOpenChange}
            className="space-y-2"
        >
            <Label>Partner (Optional)</Label>
            <div className="flex flex-row items-center gap-2">
                <Input
                    placeholder="Search partner..."
                    value={searchPartner}
                    onChange={e => setSearchPartner(e.target.value)}
                    className="flex-1"
                />
                <CollapsibleTrigger asChild>
                    <Button
                        type="button"
                        variant={open ? 'destructive' : 'outline'}
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
                </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                    <Label htmlFor="partnerName">
                        Partner Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="partnerName"
                        placeholder="John Doe"
                        value={partnerName}
                        onChange={e => setPartnerName(e.target.value)}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Partner will be created automatically if it doesn&apos;t exist
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="partnerMeritContact">
                        Merit Contact <span className="text-destructive">*</span>
                    </Label>
                    {meritContacts.length > 0 ? (
                        <Select
                            value={partnerMeritContact}
                            onValueChange={setPartnerMeritContact}
                            required
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
                            required
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