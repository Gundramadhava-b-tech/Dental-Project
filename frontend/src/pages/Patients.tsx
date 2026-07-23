import { useState } from "react";
import { useListPatients, useCreatePatient } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, User, ChevronRight } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(0, "Age must be positive").max(150, "Invalid age"),
  gender: z.enum(["Male", "Female", "Other"]),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: patients = [], isLoading } = useListPatients();
  const createPatientMutation = useCreatePatient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: { name: "", age: undefined, gender: "Other", email: "", phone: "" },
  });

  const onSubmit = (data: PatientFormValues) => {
    createPatientMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        toast({ title: "Patient added", description: "Successfully created new patient record." });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (err) => {
        toast({ title: "Error", description: "Failed to add patient.", variant: "destructive" });
      }
    });
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="section-header">
          <div className="text-xs font-semibold text-muted-foreground mb-1 tracking-widest uppercase">Home / Patients</div>
          <h1 className="text-4xl font-display font-extrabold text-foreground leading-tight">Patients Registry</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage patient records and histories</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all rounded-xl h-11 px-6">
              <Plus className="w-4 h-4 mr-2" /> Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Register New Patient</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" className="bg-background rounded-lg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl><Input type="number" placeholder="45" className="bg-background rounded-lg" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background rounded-lg">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl><Input placeholder="john@example.com" className="bg-background rounded-lg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl><Input placeholder="+1 (555) 000-0000" className="bg-background rounded-lg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createPatientMutation.isPending} className="w-full sm:w-auto bg-primary text-primary-foreground rounded-xl">
                    {createPatientMutation.isPending ? "Saving..." : "Save Patient"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-panel overflow-hidden border-none shadow-xl">
        <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search patients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/30"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/80 backdrop-blur-md sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient Name</th>
                <th className="px-6 py-4 font-semibold">Age / Gender</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Scans</th>
                <th className="px-6 py-4 font-semibold">Latest Status</th>
                <th className="px-6 py-4 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading patients...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground">No patients found</p>
                      <p className="text-muted-foreground mt-1">Try adjusting your search or add a new patient.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors group cursor-pointer"
                    onClick={() => setLocation(`/patients/${patient.id}`)}
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{patient.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">ID: {String(patient.id).padStart(5, '0')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {patient.age} yrs <span className="mx-1">•</span> {patient.gender}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{patient.email || '-'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{patient.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-foreground font-medium">{patient.scanCount}</td>
                    <td className="px-6 py-4"><SeverityBadge severity={patient.latestSeverity} /></td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span>{format(new Date(patient.createdAt), 'MMM d, yyyy')}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Indicator */}
        <div className="p-4 border-t border-border/50 bg-secondary/10 flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing {filteredPatients.length} of {patients.length} patients</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="h-8 border-border/50">Previous</Button>
            <Button variant="outline" size="sm" disabled className="h-8 border-border/50">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
