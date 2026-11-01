// Tipos da API Profyla. Copiados de profyla_front/src/services/**/dto.ts (decisão D-M03: sem pacote compartilhado).
// Quando o contrato mudar, atualize o web e este arquivo. A referência é o OpenAPI em /api-docs.

// --- auth/dto.ts
export namespace SignIn {
  export type Params = {
    email: string;
    password: string;
  };

  export type User = {
    id: number;
    email: string;
    name: string;
    role: "user" | "admin" | "ti";
  };

  export type Response = {
    data?: User;
  };
}

export namespace ValidateToken {
  export type Response = {
    success: boolean;
    data: SignIn.User;
  };
}

export namespace Register {
  export type Params = {
    name: string;
    cpf: string;
    email: string;
    password: string;
    password_confirmation: string;
    accept_terms: boolean;
    accept_privacy: boolean;
    confirm_success_url: string;
  };
}

// --- account/dto.ts
export namespace Account {
  export type Response = {
    id: number;
    name: string;
    email: string;
    cpf: string;
    role: string;
    confirmed_at: string | null;
    candidate_id: number | null;
    photo_url?: string | null;
  };
}

export namespace UpdateAccount {
  export type Params = {
    name?: string;
    email?: string;
  };

  export type Response = {
    message: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export namespace UpdatePassword {
  export type Params = {
    password: string;
    password_confirmation: string;
  };

  export type Response = {
    message: string;
  };
}

export namespace EmailPreferences {
  export type Category = "opportunities" | "birthday" | "digest";
  export type Preferences = Record<Category, boolean>;
  export type Response = { preferences: Preferences };
}

// --- candidates/dto.ts
export namespace CreateCandidateProfile {
  // Sensitive answers (LGPD) are optional: omit or send null to leave them blank.
  export type Params = {
    phone_number1: string;
    phone_number2: string;
    employee: boolean;
    resume: string;
    birthplace: string;
    gender: string;
    birthdate: string;
    marital_status?: string | null;
    address_neighborhood: string;
    address_city: string;
    mother_name?: string | null;
    spouse_name?: string | null;
    number_of_children?: number | null;
    residence_status: string;
    possessions?: string | null;
    other_incomes?: boolean | null;
    relatives_in_company?: boolean | null;
    pcd?: string | null;
    smoker?: boolean | null;
    alcohol_consumer?: boolean | null;
    medication_user?: boolean | null;
    first_question?: string;
    second_question?: string;
    third_question?: string;
    fourth_question?: string;
    fifth_question?: string;
  };

  export type Response = {
    message: string;
  };
}

// --- curriculum/dto.ts
export namespace CurriculumData {
  export type Document = {
    id: number;
    document_name: string;
    document_number: string;
    issue_date?: string;
    location?: string;
    image_url?: string | null;
  };

  export type AcademicHistory = {
    id: number;
    title: string;
    institution: string;
    degree: string;
    start_date?: string;
    end_date?: string;
  };

  export type EmploymentHistory = {
    id: number;
    company_name: string;
    position: string;
    salary?: string;
    start_date?: string;
    end_date?: string;
    leaving_reason?: string;
    achievements?: string;
    reference_name?: string;
    reference_phone?: string;
  };

  export type LinkItem = {
    id: number;
    title: string;
    link: string;
  };

  export type SkillItem = {
    id: number;
    skill_id: number;
    title: string;
  };

  export type KnowledgeItem = {
    id: number;
    knowledge_id: number;
    title: string;
  };

  export type Profile = {
    id: number;
    phone_number1?: string;
    phone_number2?: string;
    employee?: boolean;
    resume?: string;
    birthplace?: string;
    gender?: string;
    birthdate?: string;
    marital_status?: string;
    address_neighborhood?: string;
    address_city?: string;
    mother_name?: string;
    spouse_name?: string;
    number_of_children?: number;
    residence_status?: string;
    possessions?: string;
    other_incomes?: boolean;
    relatives_in_company?: boolean;
    pcd?: string;
    smoker?: boolean;
    alcohol_consumer?: boolean;
    medication_user?: boolean;
    first_question?: string;
    second_question?: string;
    third_question?: string;
    fourth_question?: string;
    fifth_question?: string;
  };

  export type Response = {
    candidate_profile: Profile | null;
    curriculum_file: { filename: string; byte_size: number; url: string } | null;
    documents: Document[];
    academic_histories: AcademicHistory[];
    employment_histories: EmploymentHistory[];
    professional_links: LinkItem[];
    social_links: LinkItem[];
    skills: SkillItem[];
    knowledges: KnowledgeItem[];
    profiles: { id: number; title: string }[];
  };
}

export namespace CreateAcademic {
  export type Params = {
    title: string;
    institution?: string;
    degree?: string;
    start_date?: string;
    end_date?: string;
  };
}

export namespace CreateEmployment {
  export type Params = {
    company_name: string;
    position: string;
    salary?: string;
    start_date?: string;
    end_date?: string;
    leaving_reason?: string;
    achievements?: string;
    reference_name?: string;
    reference_phone?: string;
  };
}

export namespace CreateLink {
  export type Params = {
    title: string;
    link: string;
  };
}

export namespace CreateDocument {
  export type Params = {
    document_name: string;
    document_number: string;
    issue_date?: string;
    location?: string;
    image?: unknown;
  };
}

export namespace CatalogItem {
  export type Item = {
    id: number;
    title: string;
  };
}

// WP-42: importação do currículo a partir do PDF (rascunho -> revisão -> aplicar).
export namespace CurriculumImport {
  export type Confidence = "high" | "medium" | "low";
  export type ProfileField =
    | "phone_number1"
    | "phone_number2"
    | "address_city"
    | "address_neighborhood"
    | "birthplace"
    | "birthdate"
    | "employee"
    | "resume";

  export type ProfileItem = {
    field: ProfileField;
    value: string | boolean;
    current: string | boolean | null;
    confidence: Confidence;
    selected: boolean;
  };

  export type EmploymentData = {
    company_name: string | null;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    achievements: string | null;
  };

  export type AcademicData = {
    title: string | null;
    institution: string | null;
    degree: string | null;
    start_date: string | null;
    end_date: string | null;
  };

  export type LinkData = { title: string; link: string };

  export type ListItem<T> = {
    key: string;
    confidence: Confidence;
    selected: boolean;
    missing: string[];
    warnings: string[];
    data: T;
  };

  export type CatalogEntry = { skill_id?: number; knowledge_id?: number; title: string; selected: boolean };

  export type Draft = {
    run_id: number;
    source: {
      filename: string;
      pages_read: number;
      truncated: boolean;
      columns_detected: boolean;
      headings_found: boolean;
      parser_version: string;
      skipped_duplicates: number;
      notes: string[];
    };
    profile: ProfileItem[];
    employment_histories: ListItem<EmploymentData>[];
    academic_histories: ListItem<AcademicData>[];
    professional_links: ListItem<LinkData>[];
    social_links: ListItem<LinkData>[];
    skills: CatalogEntry[];
    knowledges: CatalogEntry[];
    unmatched_terms: string[];
  };

  export type ApplyItem<T> = { data: T; edited: boolean };

  export type ApplyPayload = {
    run_id: number;
    profile: Partial<Record<ProfileField, string | boolean>>;
    employment_histories: ApplyItem<EmploymentData>[];
    academic_histories: ApplyItem<AcademicData>[];
    professional_links: ApplyItem<LinkData>[];
    social_links: ApplyItem<LinkData>[];
    skill_ids: number[];
    knowledge_ids: number[];
  };
}

// --- opportunities/dto.ts
export namespace OpportunityList {
  export type Item = {
    hiring_process_id: number;
    status: string;
    initial_stage_id: number | null;
    initial_stage_title: string | null;
    stages_count: number;
    already_applied: boolean;
    job: {
      id: number;
      title: string;
      description: string;
      requirements: string;
      job_location: string;
      modality: string;
      regime: string;
      salary: string;
      work_schedule: string;
      company_name: string;
    };
  };

  export type Response = Item[];
}

export namespace OpportunityDetail {
  export type Response = OpportunityList.Item;
}

// --- applications/dto.ts
export namespace ListApplications {
  export type Item = {
    id: number;
    stage_id: number;
    created_at?: string;
    updated_at?: string;
    stage: string;
    job_name: string;
    company_name: string;
    job_location?: string;
    modality?: string;
    terminal_state: boolean;
    status_tone: "positive" | "negative" | "neutral";
  };

  export type Response = Item[];
}

export namespace CreateApplication {
  export type Params = {
    hiring_process_stage_id: number;
  };

  export type Response = {
    id: number;
    hiring_process_stage_id: number;
    candidate_id: number;
  };
}

export namespace ApplicationDetail {
  export type TimelineEntry = {
    kind: "stage" | "interview" | "form" | "exam";
    at: string;
    title: string;
    description?: string | null;
    scheduled_for?: string;
    status?: string;
  };

  export type Interview = {
    id: number;
    date_time: string;
    interview_type: string;
    interviewer: string;
    interview_method: string;
    resume: string;
    status?: string;
    google_calendar_url?: string;
    suggested_datetime?: string | null;
    candidate_message?: string | null;
  };

  export type FormField = {
    id: number;
    question: string;
    response_type: "text" | "string" | "number" | "boolean" | "date";
  };

  export type ExamAlternative = {
    id: number;
    text: string;
  };

  export type ExamQuestion = {
    id: number;
    text: string;
    alternatives: ExamAlternative[];
  };

  export type Response = {
    application_id: number;
    job_name: string;
    company_name: string;
    job_location?: string;
    modality?: string;
    salary?: string;
    stage: string;
    stage_id: number;
    hiring_process_id: number;
    terminal_state: boolean;
    status_tone: "positive" | "negative" | "neutral";
    summary: string;
    interviews: Interview[];
    timeline: TimelineEntry[];
    feedback: {
      specific_comment?: string;
      improvements?: string;
    } | null;
    tools: {
      dynamic_form_id: number | null;
      dynamic_exam_id: number | null;
      has_form: boolean;
      has_exam: boolean;
      form_already_submitted: boolean;
      exam_already_submitted: boolean;
      can_withdraw: boolean;
      can_respond_interview: boolean;
      form_fields: FormField[];
      exam_questions: ExamQuestion[];
    };
  };
}

export namespace SubmitFormResponse {
  export type Params = {
    application_status_id: number;
    dynamic_form_id: number;
    form_responses_attributes: Record<number, { response: string | number | boolean }>;
  };

  export type Response = {
    id: number;
  };
}

export namespace SubmitExamResponse {
  export type Params = {
    application_status_id: number;
    dynamic_exam_id: number;
    exam_responses_attributes: { question_id: number; alternative_id: number }[];
  };

  export type Response = {
    id: number;
  };
}

export namespace WithdrawApplication {
  export type Params = {
    feedback: string;
  };

  export type Response = {
    message: string;
  };
}

export namespace InterviewResponse {
  export type Params = {
    interview_id: number;
    response: "accept" | "reschedule" | "decline";
    suggested_datetime?: string;
    message?: string;
  };

  export type Response = {
    message: string;
  };
}

// --- notifications/dto.ts
export namespace NotificationList {
  export type Item = {
    id: number;
    kind: string;
    title: string;
    body: string | null;
    link: string | null;
    read: boolean;
    created_at: string;
  };

  export type Response = {
    unread_count: number;
    records: Item[];
  };
}

// --- legal/dto.ts
export namespace Legal {
  export type Kind = "terms" | "privacy" | "assessment_notice";

  export type Document = {
    kind: Kind;
    version: string;
    content: string;
    published_at: string;
  };

  export type ConsentItem = {
    kind: Kind;
    version: string;
    accepted: boolean;
    accepted_at: string | null;
  };

  export type Consents = {
    documents: ConsentItem[];
    pending: Kind[];
  };
}

// --- portal/dto.ts
export namespace HomeData {
  export type Application = {
    id: number;
    stage_id: number;
    stage_title: string;
    hiring_process_id: number;
    job_title: string;
    company_name: string;
    terminal_state: boolean;
    created_at: string;
    updated_at: string;
  };

  export type Notification = {
    id: number;
    title: string;
    notification_type: string;
    message: string;
    created_at: string;
  };

  export type Opportunity = {
    hiring_process_id: number;
    status: string;
    initial_stage_id: number | null;
    initial_stage_title: string | null;
    job: {
      id: number;
      title: string;
      company_name: string;
      modality: string;
      salary: string;
      job_location: string;
    };
    already_applied: boolean;
  };

  export type Response = {
    profile_completion: number;
    outstanding_actions_count: number;
    latest_applications: Application[];
    notifications: Notification[];
    opportunities: Opportunity[];
  };
}

// --- assessments/disc/dto.ts
export namespace DiscQuestions {
  export type Item = { id: string; text: string };
  export type Response = Item[];
}

export namespace DiscResult {
  export type Dimensions = { D: number; I: number; S: number; C: number };

  export type Profile = {
    primary: keyof Dimensions;
    secondary: keyof Dimensions;
    label: string;
    gap: number;
  };

  export type Quality = {
    neutral_rate: number;
    extreme_rate: number;
    low_differentiation: boolean;
  };

  export type Attempt = {
    id: number;
    assessment_version: string;
    dimensions: Dimensions;
    traits: Record<string, number>;
    profile: Profile;
    quality: Quality;
    completed_at: string;
    interpretation?: Interpretation;
  };

  export type Interpretation = {
    version: string;
    disclaimer: string;
    dimensions: { key: string; name: string; summary: string; score: number; band: string; band_label: string; text: string }[];
  };

  export type Response = {
    latest: Attempt | null;
    history: Attempt[];
  };
}

export namespace SubmitDisc {
  export type Params = { answers: Record<string, string> };
  export type Response = DiscResult.Response;
}

// --- assessments/eneagrama/dto.ts
export namespace EneagramaQuestions {
  export type Item = { id: string; text: string };
  export type Response = Item[];
}

export namespace EneagramaResult {
  export type Types = {
    E1: number; E2: number; E3: number; E4: number; E5: number;
    E6: number; E7: number; E8: number; E9: number;
  };

  export type Centers = { instinctive: number; emotional: number; mental: number };

  export type Profile = {
    primary: keyof Types;
    primary_score: number;
    secondary: keyof Types;
    secondary_score: number;
    gap: number;
    wing: keyof Types | null;
    wing_gap: number;
    label: string;
  };

  export type Quality = {
    neutral_rate: number;
    extreme_rate: number;
    low_differentiation: boolean;
  };

  export type Attempt = {
    id: number;
    assessment_version: string;
    types: Types;
    traits: Record<string, number>;
    centers: Centers;
    profile: Profile;
    quality: Quality;
    completed_at: string;
    interpretation?: Interpretation;
  };

  export type TypeText = { key: string; name: string; summary: string; attention: string };

  export type Interpretation = {
    version: string;
    disclaimer: string;
    primary: TypeText | null;
    secondary: TypeText | null;
    wing: string;
  };

  export type Response = {
    latest: Attempt | null;
    history: Attempt[];
  };
}

export namespace SubmitEneagrama {
  export type Params = { answers: Record<string, string> };
  export type Response = EneagramaResult.Response;
}
