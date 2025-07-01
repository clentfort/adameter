'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import HistoryListInternal from '@/components/history-list';
import { useMedicationRegimens } from '@/hooks/use-medication-regimens';
import { useMedications } from '@/hooks/use-medications';
import { MedicationRegimen } from '@/types/medication-regimen';
import { Edit, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import '@/i18n';
import { fbt } from 'fbtee';

// Helper function to format date strings
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format schedule
const formatSchedule = (schedule: MedicationRegimen['schedule']) => {
  switch (schedule.type) {
    case 'daily':
      return `Daily at ${schedule.times.join(', ')}`;
    case 'interval':
      return `Every ${schedule.intervalValue} ${schedule.intervalUnit}, first dose at ${schedule.firstDoseTime}`;
    case 'weekly':
      return `Weekly on ${schedule.daysOfWeek.join(', ')} at ${schedule.times.join(', ')}`;
    case 'asNeeded':
      return `As needed: ${schedule.details}`;
    default:
      return 'N/A';
  }
};

// Placeholder functions for edit/delete actions
const handleEditRegimen = (regimenId: string) => { /* Placeholder for actual edit logic */ };
const handleDeleteRegimen = (regimenId: string) => { /* Placeholder for actual delete logic */ };
const handleEditAdministration = (adminId: string) => { /* Placeholder for actual edit logic */ };
const handleDeleteAdministration = (adminId: string) => { /* Placeholder for actual delete logic */ };

export default function MedicationPage() {
  const { medicationRegimens } = useMedicationRegimens();
  const { medications } = useMedications();

  const { activeRegimens, pastRegimens } = useMemo(() => {
    const now = new Date().toISOString();
    // Ensure medicationRegimens is an array before calling reduce
    const currentRegimens = Array.isArray(medicationRegimens) ? medicationRegimens : [];
    return currentRegimens.reduce(
      (acc, regimen) => {
        const isActive = !regimen.isDiscontinued && (!regimen.endDate || regimen.endDate > now);
        if (isActive) {
          acc.activeRegimens.push(regimen);
        } else {
          acc.pastRegimens.push(regimen);
        }
        return acc;
      },
      { activeRegimens: [] as MedicationRegimen[], pastRegimens: [] as MedicationRegimen[] }
    );
  }, [medicationRegimens]);

  const medicationsByDate = useMemo(() => {
    const grouped: Record<string, ReturnType<typeof useMedications>['medications']> = {};
    // Ensure medications is an array before spreading and sorting
    const currentMedications = Array.isArray(medications) ? medications : [];
    [...currentMedications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach((med) => {
        const date = new Date(med.timestamp).toLocaleDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(med);
      });
    return grouped;
  }, [medications]);

  const getRegimenNameById = (regimenId: string) => {
    const regimen = medicationRegimens.find(r => r.id === regimenId);
    return regimen ? regimen.name : 'Unknown Medication';
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold mb-6">
        <fbt desc="Main heading for the Medications page">Medications</fbt>
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          <fbt desc="Section heading for Medication Regimens">Medication Regimens</fbt>
        </h2>
        <Accordion type="multiple" defaultValue={['active-regimens']} className="w-full">
          <AccordionItem value="active-regimens">
            <AccordionTrigger>
              <fbt desc="Accordion title for active medication regimens">Active Regimens</fbt> ({activeRegimens.length})
            </AccordionTrigger>
            <AccordionContent>
              {activeRegimens.length > 0 ? (
                activeRegimens.map((regimen) => (
                  <div key={regimen.id} className="p-4 border rounded-md mb-2">
                    <h3 className="font-semibold">{regimen.name}</h3>
                    <p><strong><fbt desc="Label for dosage">Dosage:</fbt></strong> {regimen.dosageAmount} {regimen.dosageUnit}</p>
                    <p><strong><fbt desc="Label for schedule">Schedule:</fbt></strong> {formatSchedule(regimen.schedule)}</p>
                    <p><strong><fbt desc="Label for start date">Start Date:</fbt></strong> {formatDate(regimen.startDate)}</p>
                    {regimen.endDate && <p><strong><fbt desc="Label for end date">End Date:</fbt></strong> {formatDate(regimen.endDate)}</p>}
                    <p><strong><fbt desc="Label for prescriber">Prescriber:</fbt></strong> {regimen.prescriber} {regimen.prescriberName && `(${regimen.prescriberName})`}</p>
                    {regimen.notes && <p><strong><fbt desc="Label for notes">Notes:</fbt></strong> {regimen.notes}</p>}
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditRegimen(regimen.id)}>
                        <Edit className="h-4 w-4 mr-1" /> <fbt common>Edit</fbt>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteRegimen(regimen.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> <fbt common>Delete</fbt>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p><fbt desc="Message when there are no active regimens">No active regimens.</fbt></p>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="past-regimens">
            <AccordionTrigger>
              <fbt desc="Accordion title for past medication regimens">Past & Discontinued Regimens</fbt> ({pastRegimens.length})
            </AccordionTrigger>
            <AccordionContent>
              {pastRegimens.length > 0 ? (
                pastRegimens.map((regimen) => (
                  <div key={regimen.id} className="p-4 border rounded-md mb-2">
                    <h3 className="font-semibold">{regimen.name}</h3>
                    <p><strong><fbt desc="Label for dosage">Dosage:</fbt></strong> {regimen.dosageAmount} {regimen.dosageUnit}</p>
                    <p><strong><fbt desc="Label for schedule">Schedule:</fbt></strong> {formatSchedule(regimen.schedule)}</p>
                    <p><strong><fbt desc="Label for start date">Start Date:</fbt></strong> {formatDate(regimen.startDate)}</p>
                    {regimen.endDate && <p><strong><fbt desc="Label for end date">End Date:</fbt></strong> {formatDate(regimen.endDate)}</p>}
                    {regimen.isDiscontinued && <p className="text-red-600"><strong><fbt desc="Indicator that a regimen is discontinued">Discontinued</fbt></strong></p>}
                    <p><strong><fbt desc="Label for prescriber">Prescriber:</fbt></strong> {regimen.prescriber} {regimen.prescriberName && `(${regimen.prescriberName})`}</p>
                    {regimen.notes && <p><strong><fbt desc="Label for notes">Notes:</fbt></strong> {regimen.notes}</p>}
                     <div className="mt-2 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditRegimen(regimen.id)}>
                        <Edit className="h-4 w-4 mr-1" /> <fbt common>Edit</fbt>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteRegimen(regimen.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> <fbt common>Delete</fbt>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p><fbt desc="Message when there are no past regimens">No past or discontinued regimens.</fbt></p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            <fbt desc="Section heading for Medication Administrations History">Medication Administrations History</fbt>
          </h2>
        </div>
        {Object.keys(medicationsByDate).length > 0 ? (
          Object.entries(medicationsByDate).map(([date, meds]) => (
            <div className="mb-4" key={date}>
              <h3 className="text-lg font-medium mb-2">{date}</h3>
              <HistoryListInternal
                dateAccessor={(med) => med.timestamp}
                entries={meds}
              >
                {(med) => (
                  <div key={med.id} className="p-3 border rounded-md mb-2 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">
                        {getRegimenNameById(med.regimenId)} - {med.dosageAmount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(med.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - <fbt desc="Label for administration status">Status:</fbt> {med.administrationStatus}
                        {med.details && ` (${med.details})`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                       <Button onClick={() => handleEditAdministration(med.id)} size="icon" variant="ghost">
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button onClick={() => handleDeleteAdministration(med.id)} size="icon" variant="ghost">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                )}
              </HistoryListInternal>
            </div>
          ))
        ) : (
          <p><fbt desc="Message when there is no medication administration history">No medication administration history.</fbt></p>
        )}
      </section>
    </div>
  );
}
