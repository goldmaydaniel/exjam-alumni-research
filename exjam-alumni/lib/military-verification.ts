import { z } from "zod";

// Military service validation schemas
export const ServiceNumberSchema = z
  .string()
  .min(6, "Service number must be at least 6 characters")
  .max(20, "Service number must not exceed 20 characters")
  .regex(
    /^[A-Z0-9\/\-]+$/,
    "Service number must contain only letters, numbers, hyphens, and forward slashes"
  )
  .refine((val) => val.trim().length > 0, "Service number is required");

export const SquadronSchema = z
  .string()
  .min(2, "Squadron must be at least 2 characters")
  .max(100, "Squadron must not exceed 100 characters")
  .refine((val) => val.trim().length > 0, "Squadron is required");

// Military rank options (Nigerian Air Force structure)
export const MILITARY_RANKS = [
  // Officers
  { value: "AVM", label: "Air Vice Marshal (AVM)", category: "officer" },
  { value: "AVM", label: "Air Commodore (AVM)", category: "officer" },
  { value: "GPCAPT", label: "Group Captain (GPCAPT)", category: "officer" },
  { value: "WGCDR", label: "Wing Commander (WGCDR)", category: "officer" },
  { value: "SQNLDR", label: "Squadron Leader (SQNLDR)", category: "officer" },
  { value: "FLTLT", label: "Flight Lieutenant (FLTLT)", category: "officer" },
  { value: "FLYOFF", label: "Flying Officer (FLYOFF)", category: "officer" },
  { value: "PLTOFF", label: "Pilot Officer (PLTOFF)", category: "officer" },

  // Non-Commissioned Officers
  { value: "WO", label: "Warrant Officer (WO)", category: "nco" },
  { value: "FS", label: "Flight Sergeant (FS)", category: "nco" },
  { value: "SGT", label: "Sergeant (SGT)", category: "nco" },
  { value: "CPL", label: "Corporal (CPL)", category: "nco" },
  { value: "LCPL", label: "Lance Corporal (LCPL)", category: "nco" },
  { value: "AC", label: "Aircraftman (AC)", category: "nco" },
] as const;

// Squadron/Unit options (common Nigerian Air Force units)
export const COMMON_SQUADRONS = [
  { value: "7SQN", label: "7 Squadron", location: "Maiduguri" },
  { value: "9SQN", label: "9 Squadron", location: "Maiduguri" },
  { value: "15SQN", label: "15 Squadron", location: "Makurdi" },
  { value: "17SQN", label: "17 Squadron", location: "Port Harcourt" },
  { value: "21SQN", label: "21 Squadron", location: "Agatu" },
  { value: "23SQN", label: "23 Squadron", location: "Makurdi" },
  { value: "33SQN", label: "33 Squadron", location: "Kaduna" },
  { value: "35SQN", label: "35 Squadron", location: "Yenagoa" },
  { value: "51SQN", label: "51 Squadron", location: "Enugu" },
  { value: "77SQN", label: "77 Squadron", location: "Kano" },
  { value: "79SQN", label: "79 Squadron", location: "Gombe" },
  { value: "87SQN", label: "87 Squadron", location: "Birnin Kebbi" },
  { value: "91SQN", label: "91 Squadron", location: "Gusau" },
  { value: "99SQN", label: "99 Squadron", location: "Kainji" },
  { value: "101SQN", label: "101 Squadron", location: "Minna" },
  { value: "105SQN", label: "105 Squadron", location: "Yola" },
  { value: "107SQN", label: "107 Squadron", location: "Jos" },
  { value: "115SQN", label: "115 Squadron", location: "Kano" },
  { value: "117SQN", label: "117 Squadron", location: "Katsina" },
  { value: "119SQN", label: "119 Squadron", location: "Kaduna" },
  { value: "205SQN", label: "205 Squadron", location: "Ilorin" },
  { value: "211SQN", label: "211 Squadron", location: "Kaduna" },
  { value: "213SQN", label: "213 Squadron", location: "Kaduna" },
  { value: "301SQN", label: "301 Squadron", location: "Kaduna" },
  { value: "315SQN", label: "315 Squadron", location: "Kaduna" },
  { value: "401SQN", label: "401 Squadron", location: "Kaduna" },
  { value: "403SQN", label: "403 Squadron", location: "Kano" },
  { value: "501SQN", label: "501 Squadron", location: "Lagos" },
  { value: "557SQN", label: "557 Squadron", location: "Kaduna" },

  // Support Units
  { value: "AFCSC", label: "Air Force Command and Staff College", location: "Jaji" },
  { value: "AFIT", label: "Air Force Institute of Technology", location: "Kaduna" },
  { value: "AFSS", label: "Air Force Secondary School", location: "Jos" },
  { value: "AFGSC", label: "Air Force Ground Support Command", location: "Abuja" },
  { value: "AFHQ", label: "Air Force Headquarters", location: "Abuja" },
  { value: "AFSOC", label: "Air Force Special Operations Command", location: "Bauchi" },

  // Other/Custom
  { value: "OTHER", label: "Other (Please specify)", location: "" },
] as const;

// Service years validation
export const SERVICE_YEARS = {
  MIN_YEAR: 1960, // Nigerian Air Force established
  MAX_YEAR: new Date().getFullYear(),
} as const;

// Military service record schema
export const MilitaryServiceSchema = z
  .object({
    serviceNumber: ServiceNumberSchema,
    squadron: SquadronSchema,
    rank: z.string().min(1, "Rank is required"),
    serviceYearFrom: z
      .number()
      .min(SERVICE_YEARS.MIN_YEAR, `Service year must be after ${SERVICE_YEARS.MIN_YEAR}`)
      .max(SERVICE_YEARS.MAX_YEAR, `Service year cannot be in the future`),
    serviceYearTo: z
      .number()
      .min(SERVICE_YEARS.MIN_YEAR, `Service year must be after ${SERVICE_YEARS.MIN_YEAR}`)
      .max(SERVICE_YEARS.MAX_YEAR + 10, `Service year cannot be too far in the future`)
      .nullable(),
    customSquadron: z.string().optional(),
    specialization: z.string().optional(),
    baseLocation: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.serviceYearTo && data.serviceYearFrom && data.serviceYearTo < data.serviceYearFrom) {
        return false;
      }
      return true;
    },
    {
      message: "Service end year must be after start year",
      path: ["serviceYearTo"],
    }
  );

// Service number format validation
export const validateServiceNumber = (
  serviceNumber: string
): { isValid: boolean; message: string } => {
  if (!serviceNumber || serviceNumber.trim().length === 0) {
    return { isValid: false, message: "Service number is required" };
  }

  const trimmed = serviceNumber.trim().toUpperCase();

  // Check length
  if (trimmed.length < 6 || trimmed.length > 20) {
    return { isValid: false, message: "Service number must be 6-20 characters long" };
  }

  // Check format (letters, numbers, hyphens, forward slashes only)
  if (!/^[A-Z0-9\/\-]+$/.test(trimmed)) {
    return {
      isValid: false,
      message: "Service number can only contain letters, numbers, hyphens, and forward slashes",
    };
  }

  // Common Nigerian Air Force service number patterns
  const patterns = [
    /^NAF\/\d{4,8}$/, // NAF/12345678
    /^[A-Z]{2,4}\/\d{4,8}$/, // ABC/12345678
    /^\d{6,12}$/, // 123456789
    /^[A-Z]\d{6,10}$/, // A1234567
  ];

  const hasValidPattern = patterns.some((pattern) => pattern.test(trimmed));

  if (!hasValidPattern) {
    return {
      isValid: false,
      message:
        "Service number format appears invalid. Common formats: NAF/12345678, ABC/12345678, 123456789",
    };
  }

  return { isValid: true, message: "Valid service number format" };
};

// Check for duplicate service numbers
export const checkDuplicateServiceNumber = async (
  serviceNumber: string,
  excludeUserId?: string
): Promise<boolean> => {
  try {
    // This would connect to your database to check for duplicates
    // Implementation depends on your database setup (Prisma, Supabase, etc.)

    // For now, return false (no duplicate found)
    // In real implementation:
    // const existingMember = await prisma.user.findFirst({
    //   where: {
    //     serviceNumber: serviceNumber.toUpperCase(),
    //     id: { not: excludeUserId }
    //   }
    // });
    // return !!existingMember;

    return false;
  } catch (error) {
    console.error("Error checking duplicate service number:", error);
    return false;
  }
};

// Squadron validation and formatting
export const validateSquadron = (
  squadron: string
): { isValid: boolean; message: string; suggestion?: string } => {
  if (!squadron || squadron.trim().length === 0) {
    return { isValid: false, message: "Squadron is required" };
  }

  const trimmed = squadron.trim().toUpperCase();

  // Check if it matches a common squadron
  const knownSquadron = COMMON_SQUADRONS.find(
    (sq) => sq.value.toUpperCase() === trimmed || sq.label.toUpperCase().includes(trimmed)
  );

  if (knownSquadron && knownSquadron.value !== "OTHER") {
    return {
      isValid: true,
      message: `Recognized squadron: ${knownSquadron.label}`,
      suggestion: knownSquadron.value,
    };
  }

  // Check for common squadron number patterns
  const squadronNumberPattern = /^\d{1,3}(SQN|SQUADRON)$/;
  if (squadronNumberPattern.test(trimmed)) {
    return { isValid: true, message: "Valid squadron format" };
  }

  // Check for other valid patterns
  const validPatterns = [
    /^[A-Z]{2,6}$/, // Abbreviations like AFCSC, AFIT
    /^\d{1,3}\s*(SQN|SQUADRON)$/i, // "105 Squadron"
    /^[A-Z\s]{3,50}$/, // Full names with spaces
  ];

  const hasValidPattern = validPatterns.some((pattern) => pattern.test(trimmed));

  if (!hasValidPattern) {
    return {
      isValid: false,
      message:
        "Invalid squadron format. Examples: 105SQN, AFCSC, Air Force Command and Staff College",
    };
  }

  return { isValid: true, message: "Valid squadron format" };
};

// Format service number consistently
export const formatServiceNumber = (serviceNumber: string): string => {
  return serviceNumber.trim().toUpperCase();
};

// Format squadron consistently
export const formatSquadron = (squadron: string): string => {
  const trimmed = squadron.trim().toUpperCase();

  // Check if it's a known squadron and return the standard format
  const knownSquadron = COMMON_SQUADRONS.find(
    (sq) => sq.value.toUpperCase() === trimmed || sq.label.toUpperCase().includes(trimmed)
  );

  if (knownSquadron && knownSquadron.value !== "OTHER") {
    return knownSquadron.value;
  }

  return trimmed;
};

// Generate military profile completeness score
export const calculateMilitaryProfileCompleteness = (profile: {
  serviceNumber?: string;
  squadron?: string;
  rank?: string;
  serviceYearFrom?: number;
  serviceYearTo?: number | null;
  specialization?: string;
  baseLocation?: string;
}): { score: number; missingFields: string[] } => {
  const fields = [
    { key: "serviceNumber", name: "Service Number", required: true },
    { key: "squadron", name: "Squadron", required: true },
    { key: "rank", name: "Rank", required: true },
    { key: "serviceYearFrom", name: "Service Start Year", required: true },
    { key: "serviceYearTo", name: "Service End Year", required: false },
    { key: "specialization", name: "Specialization", required: false },
    { key: "baseLocation", name: "Base Location", required: false },
  ];

  const requiredFields = fields.filter((f) => f.required);
  const optionalFields = fields.filter((f) => !f.required);

  const missingRequired = requiredFields.filter(
    (field) =>
      !profile[field.key as keyof typeof profile] ||
      String(profile[field.key as keyof typeof profile]).trim().length === 0
  );

  const presentOptional = optionalFields.filter(
    (field) =>
      profile[field.key as keyof typeof profile] &&
      String(profile[field.key as keyof typeof profile]).trim().length > 0
  );

  // Base score: Required fields (80%), Optional fields (20%)
  const requiredScore =
    ((requiredFields.length - missingRequired.length) / requiredFields.length) * 80;
  const optionalScore = (presentOptional.length / optionalFields.length) * 20;

  const score = Math.round(requiredScore + optionalScore);
  const missingFields = missingRequired.map((f) => f.name);

  return { score, missingFields };
};

// Military service validation for forms
export const validateMilitaryService = async (data: {
  serviceNumber: string;
  squadron: string;
  rank?: string;
  serviceYearFrom?: number;
  serviceYearTo?: number | null;
  userId?: string;
}): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  const errors: Record<string, string> = {};

  // Validate service number
  const svcValidation = validateServiceNumber(data.serviceNumber);
  if (!svcValidation.isValid) {
    errors.serviceNumber = svcValidation.message;
  } else {
    // Check for duplicates
    const isDuplicate = await checkDuplicateServiceNumber(data.serviceNumber, data.userId);
    if (isDuplicate) {
      errors.serviceNumber = "This service number is already registered by another member";
    }
  }

  // Validate squadron
  const squadronValidation = validateSquadron(data.squadron);
  if (!squadronValidation.isValid) {
    errors.squadron = squadronValidation.message;
  }

  // Validate service years
  if (data.serviceYearFrom) {
    if (data.serviceYearFrom < SERVICE_YEARS.MIN_YEAR) {
      errors.serviceYearFrom = `Service year must be after ${SERVICE_YEARS.MIN_YEAR}`;
    }
    if (data.serviceYearFrom > SERVICE_YEARS.MAX_YEAR) {
      errors.serviceYearFrom = "Service year cannot be in the future";
    }
  }

  if (data.serviceYearTo) {
    if (data.serviceYearTo < SERVICE_YEARS.MIN_YEAR) {
      errors.serviceYearTo = `Service year must be after ${SERVICE_YEARS.MIN_YEAR}`;
    }
    if (data.serviceYearTo > SERVICE_YEARS.MAX_YEAR + 10) {
      errors.serviceYearTo = "Service year cannot be too far in the future";
    }
    if (data.serviceYearFrom && data.serviceYearTo < data.serviceYearFrom) {
      errors.serviceYearTo = "Service end year must be after start year";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export type MilitaryServiceData = z.infer<typeof MilitaryServiceSchema>;
export type ServiceRank = (typeof MILITARY_RANKS)[number];
export type Squadron = (typeof COMMON_SQUADRONS)[number];
