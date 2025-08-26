"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  MilitaryServiceSchema,
  MILITARY_RANKS,
  COMMON_SQUADRONS,
  validateServiceNumber,
  validateSquadron,
  validateMilitaryService,
  formatServiceNumber,
  formatSquadron,
  type MilitaryServiceData,
} from "@/lib/military-verification";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, Info, Search } from "lucide-react";

interface MilitaryServiceFormProps {
  onSubmit: (data: MilitaryServiceData) => Promise<void>;
  initialData?: Partial<MilitaryServiceData>;
  isLoading?: boolean;
  showTitle?: boolean;
  required?: boolean;
  userId?: string;
}

export const MilitaryServiceForm: React.FC<MilitaryServiceFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  showTitle = true,
  required = true,
  userId,
}) => {
  const [serviceNumberValidation, setServiceNumberValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: false, message: "" });

  const [squadronValidation, setSquadronValidation] = useState<{
    isValid: boolean;
    message: string;
    suggestion?: string;
  }>({ isValid: false, message: "" });

  const [showCustomSquadron, setShowCustomSquadron] = useState(false);
  const [squadronSearch, setSquadronSearch] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid: formIsValid },
    trigger,
  } = useForm<MilitaryServiceData>({
    resolver: zodResolver(MilitaryServiceSchema),
    defaultValues: {
      serviceNumber: initialData?.serviceNumber || "",
      squadron: initialData?.squadron || "",
      rank: initialData?.rank || "",
      serviceYearFrom: initialData?.serviceYearFrom || new Date().getFullYear() - 25,
      serviceYearTo: initialData?.serviceYearTo || null,
      customSquadron: initialData?.customSquadron || "",
      specialization: initialData?.specialization || "",
      baseLocation: initialData?.baseLocation || "",
    },
    mode: "onChange",
  });

  const watchedValues = watch();

  // Service Number validation
  const handleServiceNumberChange = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        setServiceNumberValidation({ isValid: false, message: "" });
        return;
      }

      const validation = validateServiceNumber(value);
      setServiceNumberValidation(validation);

      if (validation.isValid) {
        // Format the service number
        const formatted = formatServiceNumber(value);
        if (formatted !== value) {
          setValue("serviceNumber", formatted);
        }

        // Trigger form validation
        await trigger("serviceNumber");
      }
    },
    [setValue, trigger]
  );

  // Squadron validation
  const handleSquadronChange = useCallback(
    (value: string) => {
      if (value === "OTHER") {
        setShowCustomSquadron(true);
        setValue("squadron", "");
        setValue("customSquadron", "");
        return;
      }

      setShowCustomSquadron(false);
      setValue("customSquadron", "");

      if (!value.trim()) {
        setSquadronValidation({ isValid: false, message: "" });
        return;
      }

      const validation = validateSquadron(value);
      setSquadronValidation(validation);

      if (validation.isValid && validation.suggestion) {
        setValue("squadron", validation.suggestion);
      }

      trigger("squadron");
    },
    [setValue, trigger]
  );

  // Custom squadron validation
  const handleCustomSquadronChange = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setSquadronValidation({ isValid: false, message: "Squadron is required" });
        return;
      }

      const validation = validateSquadron(value);
      setSquadronValidation(validation);

      if (validation.isValid) {
        const formatted = formatSquadron(value);
        setValue("squadron", formatted);
        trigger("squadron");
      }
    },
    [setValue, trigger]
  );

  // Filter squadrons based on search
  const filteredSquadrons = React.useMemo(() => {
    if (!squadronSearch.trim()) return COMMON_SQUADRONS;

    const search = squadronSearch.toLowerCase();
    return COMMON_SQUADRONS.filter(
      (squadron) =>
        squadron.label.toLowerCase().includes(search) ||
        squadron.value.toLowerCase().includes(search) ||
        squadron.location.toLowerCase().includes(search)
    );
  }, [squadronSearch]);

  const handleFormSubmit = async (data: MilitaryServiceData) => {
    try {
      // Final validation
      const validation = await validateMilitaryService({
        serviceNumber: data.serviceNumber,
        squadron: data.squadron,
        rank: data.rank,
        serviceYearFrom: data.serviceYearFrom,
        serviceYearTo: data.serviceYearTo,
        userId,
      });

      if (!validation.isValid) {
        // Handle validation errors
        Object.entries(validation.errors).forEach(([field, message]) => {
          // This would set form errors, but react-hook-form doesn't have a direct API for this
          console.error(`${field}: ${message}`);
        });
        return;
      }

      await onSubmit(data);
    } catch (error) {
      console.error("Military service form submission error:", error);
    }
  };

  // Effect for initial data validation
  useEffect(() => {
    if (initialData?.serviceNumber) {
      handleServiceNumberChange(initialData.serviceNumber);
    }
    if (initialData?.squadron) {
      handleSquadronChange(initialData.squadron);
    }
  }, [initialData, handleServiceNumberChange, handleSquadronChange]);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      {showTitle && (
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              🛡️
            </div>
            Military Service Information
            {required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Please provide your military service details. This information is required for all EXJAM
            members.
          </p>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Service Number */}
          <div className="space-y-2">
            <Label htmlFor="serviceNumber" className="flex items-center gap-2">
              Service Number (SVC) <span className="text-destructive">*</span>
              {serviceNumberValidation.isValid && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </Label>
            <Controller
              name="serviceNumber"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="serviceNumber"
                  placeholder="e.g., NAF/12345678, ABC/12345678, 123456789"
                  className={cn(
                    serviceNumberValidation.message &&
                      !serviceNumberValidation.isValid &&
                      "border-destructive",
                    serviceNumberValidation.isValid && "border-green-500"
                  )}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleServiceNumberChange(e.target.value);
                  }}
                />
              )}
            />
            {serviceNumberValidation.message && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm",
                  serviceNumberValidation.isValid ? "text-green-600" : "text-destructive"
                )}
              >
                {serviceNumberValidation.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {serviceNumberValidation.message}
              </div>
            )}
            {errors.serviceNumber && (
              <p className="text-sm text-destructive">{errors.serviceNumber.message}</p>
            )}
          </div>

          {/* Military Rank */}
          <div className="space-y-2">
            <Label htmlFor="rank">
              Military Rank <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="rank"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Officers</p>
                      {MILITARY_RANKS.filter((rank) => rank.category === "officer").map((rank) => (
                        <SelectItem key={rank.value} value={rank.value}>
                          {rank.label}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="border-t p-2">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Non-Commissioned Officers
                      </p>
                      {MILITARY_RANKS.filter((rank) => rank.category === "nco").map((rank) => (
                        <SelectItem key={rank.value} value={rank.value}>
                          {rank.label}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rank && <p className="text-sm text-destructive">{errors.rank.message}</p>}
          </div>

          {/* Squadron */}
          <div className="space-y-2">
            <Label htmlFor="squadron" className="flex items-center gap-2">
              Squadron/Unit <span className="text-destructive">*</span>
              {squadronValidation.isValid && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Label>

            {/* Squadron Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search squadrons..."
                className="pl-10"
                value={squadronSearch}
                onChange={(e) => setSquadronSearch(e.target.value)}
              />
            </div>

            <Controller
              name="squadron"
              control={control}
              render={({ field }) => (
                <Select onValueChange={handleSquadronChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your squadron/unit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {filteredSquadrons.map((squadron) => (
                      <SelectItem key={squadron.value} value={squadron.value}>
                        <div className="flex flex-col items-start">
                          <span>{squadron.label}</span>
                          {squadron.location && (
                            <span className="text-xs text-muted-foreground">
                              {squadron.location}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {/* Custom Squadron Input */}
            {showCustomSquadron && (
              <Controller
                name="customSquadron"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="customSquadron">Custom Squadron/Unit Name</Label>
                    <Input
                      {...field}
                      id="customSquadron"
                      placeholder="Enter squadron/unit name"
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleCustomSquadronChange(e.target.value);
                      }}
                    />
                  </div>
                )}
              />
            )}

            {squadronValidation.message && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm",
                  squadronValidation.isValid ? "text-green-600" : "text-destructive"
                )}
              >
                {squadronValidation.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {squadronValidation.message}
              </div>
            )}
            {errors.squadron && (
              <p className="text-sm text-destructive">{errors.squadron.message}</p>
            )}
          </div>

          {/* Service Years */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serviceYearFrom">
                Service Start Year <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="serviceYearFrom"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="serviceYearFrom"
                    type="number"
                    min={1960}
                    max={new Date().getFullYear()}
                    placeholder="e.g., 2010"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.serviceYearFrom && (
                <p className="text-sm text-destructive">{errors.serviceYearFrom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceYearTo">Service End Year (Optional)</Label>
              <Controller
                name="serviceYearTo"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="serviceYearTo"
                    type="number"
                    min={1960}
                    max={new Date().getFullYear() + 10}
                    placeholder="Leave empty if still serving"
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                )}
              />
              {errors.serviceYearTo && (
                <p className="text-sm text-destructive">{errors.serviceYearTo.message}</p>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4" />
              Additional Information (Optional)
            </h3>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization/Trade</Label>
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="specialization"
                    placeholder="e.g., Pilot, Air Traffic Controller, Logistics"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseLocation">Primary Base/Location</Label>
              <Controller
                name="baseLocation"
                control={control}
                render={({ field }) => (
                  <Input {...field} id="baseLocation" placeholder="e.g., Kaduna, Lagos, Abuja" />
                )}
              />
            </div>
          </div>

          {/* Information Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your military service information will be verified by EXJAM administrators. Please
              ensure all details are accurate as they will be used for membership verification.
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!formIsValid || isLoading}>
            {isLoading ? "Saving..." : "Save Military Service Information"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MilitaryServiceForm;
