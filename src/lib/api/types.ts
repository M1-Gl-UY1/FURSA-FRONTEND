// Types miroir des DTOs backend FURSA.
// V1 : tenu manuellement. À régénérer depuis l'OpenAPI Swagger en V2 via openapi-typescript.

export type Role = 'INVESTISSEUR' | 'ADMIN'

export type StatutPropriete =
  // Workflow historique (admin direct)
  | 'EN_ATTENTE'
  | 'PUBLIEE'
  | 'REJETEE'
  // Workflow soumission propriétaire (Phase 7)
  | 'EN_REVIEW'
  | 'ACCEPTEE'
  | 'REFUSEE'
  // V2 envisagé
  | 'BROUILLON'
  | 'FINANCEE'
  | 'CLOTUREE'

export type StatutPaiement = 'EN_ATTENTE' | 'VALIDE' | 'ECHEC' | 'REMBOURSE'
export type StatutTransaction = 'EN_COURS' | 'SUCCES' | 'ECHEC'
export type StatutAnnonce = 'OUVERTE' | 'COMPLETEE' | 'ANNULEE'
export type StatutDividende = 'EN_ATTENTE' | 'VALIDE' | 'ANNULE'
export type StatutRevenu = 'EN_REVIEW' | 'VALIDE' | 'REFUSE' | 'DISTRIBUE'

export type DistributionPreviewItem = {
  investisseurId: number | null
  email: string | null
  nom: string | null
  prenom: string | null
  nombreParts: number
  totalPartsPropriete: number
  pourcentage: number
  montantAttendu: number
}

export type DistributionPreview = {
  revenuId: number
  items: DistributionPreviewItem[]
  totalInvestisseurs: number
  totalAttendu: number
}

export type TypePaiement = 'CRYPTO' | 'MOBILE_MONEY' | 'CARTE' | 'VIREMENT'
export type TypeOperation = 'ACHAT' | 'REVENTE' | 'DIVIDENDE'
export type TypeMessage = 'AVERTISSEMENT' | 'ANNONCE' | 'INFO' | 'ALERTE' | 'TRANSACTION'

// --- Auth ---

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  nom: string
  prenom: string
  telephone: string
  email: string
  password: string
  walletAddress?: string
}

export type AuthResponse = {
  token: string
  refreshToken: string
  type: string
  /** Duree de vie de l'access token en secondes. */
  expiresIn: number
}

export type RefreshRequest = {
  refreshToken: string
}

export type RegisterResponse = {
  id: number
  email: string
  nom: string
  prenom: string
  telephone: string
  role: Role
  isVerified: boolean
  walletAddress?: string | null
  deletedAt?: string | null
}

export type CurrentUser = RegisterResponse

// --- Propriété ---

export type DocumentResponse = {
  id: number
  /** Backend FURSA expose "nom". On garde aussi "fileName" pour compat. */
  nom?: string
  fileName?: string
  url: string
  type?: 'PDF' | 'IMAGE'
  dateUpload?: string
}

export type ProprieteResponse = {
  id: number
  nom: string
  description?: string
  localisation: string
  prixUnitairePart: number
  /** Nom officiel du backend */
  nombreTotalPart?: number
  /** Alias frontend (legacy) */
  partsTotales?: number
  partsDisponibles: number
  rentabilitePrevue: number
  statut: StatutPropriete
  photos?: string[]
  documents?: DocumentResponse[]
  /** Backend expose dateCreation (LocalDate ISO) */
  dateCreation?: string
  createdAt?: string
  // Phase 7 — workflow soumission propriétaire
  proposeurId?: number | null
  motifRefus?: string | null
  soumiseLe?: string | null
}

/** Soumission par un investisseur (multipart) */
export type SubmissionRequest = {
  nom: string
  localisation: string
  description?: string
  nombreTotalPart: number
  prixUnitairePart: number
  rentabilitePrevue: number
}

/** Refus admin avec motif */
export type RefusRequest = {
  motif: string
}

export type ProgressionResponse = {
  proprieteId: number
  partsTotales: number
  partsVendues: number
  partsDisponibles: number
  pourcentageVendu: number
}

// --- Marché primaire ---

export type AchatRequest = {
  proprieteId: number
  nombreParts: number
}

export type AchatResponse = {
  paiementId: number
  transactionId: number
  hashTransaction: string
  statut: string
  nombreParts: number
  montant: number
  proprieteNom: string
  dateTransaction: string
}

// --- Paiements asynchrones via PSP (Yellow Card / Mock) ---

export type PaymentInitResponse = {
  sessionId: number
  externalId: string
  widgetUrl: string | null
  expiresAt: string
  montantFiat: number
  deviseFiat: string
  montantUsdc: number
  providerName: string
  statut: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED'
}

export type PaymentSessionStatusResponse = {
  sessionId: number
  externalId: string
  statut: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED'
  txHash: string | null
  etherscanUrl: string | null
  errorMessage: string | null
  expiresAt: string
  confirmedAt: string | null
}

export type AdminPaymentSessionResponse = {
  sessionId: number
  externalId: string
  investisseurId: number
  investisseurEmail: string
  proprieteId: number
  proprieteNom: string
  nombreParts: number
  montantFiat: number
  deviseFiat: string
  montantUsdc: number
  providerName: string
  statut: 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'FAILED'
  errorMessage: string | null
  createdAt: string
  expiresAt: string
  confirmedAt: string | null
  paiementId: number | null
  transactionId: number | null
  possessionId: number | null
}

export type DeviseRate = {
  codeDevise: string
  tauxVersUsdc: number
  updatedAt: string
}

// --- KYC ---

export type StatutKyc = 'NONE' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export type SourceFonds = 'SALAIRE' | 'EPARGNE' | 'HERITAGE' | 'BUSINESS' | 'VENTE_BIEN' | 'AUTRE'

export type KycSubmissionResponse = {
  id: number
  statut: Exclude<StatutKyc, 'NONE'>
  nationalite: string | null
  dateNaissance: string | null
  paysResidence: string | null
  adresse: string | null
  documentIdentiteUrl: string | null
  documentDomicileUrl: string | null
  selfieUrl: string | null
  sourceFonds: SourceFonds | null
  isPep: boolean | null
  submittedAt: string
  reviewedAt: string | null
  motifRefus: string | null
  nombreReSubmissions: number
}

export type KycMeResponse = {
  statut: StatutKyc
  submission: KycSubmissionResponse | null
}

export type KycAdminResponse = KycSubmissionResponse & {
  investisseurId: number
  investisseurEmail: string
  investisseurNom: string
  investisseurPrenom: string
  investisseurTelephone: string
  investisseurIsVerified: boolean
  declarationSurHonneur: boolean | null
  reviewedByAdminId: number | null
}

export type KycSubmitData = {
  nationalite: string
  dateNaissance: string  // ISO date
  paysResidence: string
  adresse: string
  sourceFonds: SourceFonds
  isPep: boolean
  declarationSurHonneur: boolean
}

export type KycStats = {
  pending: number
  inReview: number
  approved: number
  rejected: number
  expired: number
}

export type PossessionResponse = {
  id: number
  proprieteId?: number
  proprieteNom: string
  localisation: string
  nombreDeParts: number
  prixUnitairePart: number
  valeurTotale: number
  rentabilitePrevue: number
}

export type TransactionResponse = {
  id: number
  hashTransaction: string
  typeOperation: TypeOperation | null
  statut: string
  nombreParts: number
  montant: number
  proprieteNom: string
  dateTransaction: string
}

export type PaiementResponse = {
  id: number
  montant: number
  type: string
  statut: string
  nombreParts: number
  proprieteNom: string
  date: string
}

// --- Marché secondaire ---

export type AnnonceResponse = {
  id: number
  vendeurId: number
  vendeurNom: string
  proprieteId: number
  proprieteNom: string
  /** Optionnel : alias frontend si fourni séparément, sinon on utilise un placeholder */
  proprieteImage?: string
  /** Backend : "nombreDePartsAVendre" */
  nombreDePartsAVendre: number
  prixUnitaireDemande: number
  statut: StatutAnnonce
  /** Optionnel : pas exposé par le DTO actuel */
  createdAt?: string
}

export type AnnonceRequest = {
  proprieteId: number
  nombreDePartsAVendre: number
  prixUnitaireDemande: number
}

export type AnnonceUpdateRequest = {
  nombreDePartsAVendre?: number
  prixUnitaireDemande?: number
}

export type AchatAnnonceRequest = {
  /** Backend : "nombreDeParts" */
  nombreDeParts: number
}

export type AchatAnnonceResponse = {
  annonceId: number
  transactionId?: number
  paiementId?: number
  acheteurId: number
  vendeurId: number
  proprieteId?: number
  /** Backend : "nombreDePartsAchetees" */
  nombreDePartsAchetees: number
  montantTotal: number
  hashTransaction: string
  /** Backend : "statutAnnonce" (string) */
  statutAnnonce?: string
}

// --- Dividendes & revenus ---

export type DividendeResponse = {
  id: number
  investisseurId: number
  proprieteNom: string
  revenuId: number
  montant: number
  hashTransaction: string
  statut: string
  dateDistribution: string
  // Phase 9 : tracabilite du payout effectif
  datePaiementEffectif?: string | null
  preuvePaiement?: string | null
  methodePaiement?: string | null
}

export type DividendesBalance = {
  aRetirer: number
  dejaRecu: number
  total: number
  nbARetirer: number
  nbDejaRecu: number
}

export type RevenuResponse = {
  id: number
  proprieteId?: number | null
  proprieteNom?: string | null
  /** Backend expose `date` (LocalDate ISO) */
  date?: string
  montantTotal: number
  // Phase 8
  proposeurId?: number | null
  statut?: StatutRevenu
  motifRefus?: string | null
  periodeDebut?: string | null
  periodeFin?: string | null
  // Phase 9 : justificatif + flag argent recu
  justificatifUrl?: string | null
  argentRecuParFursa?: boolean | null
  // Phase 10b : window declaration + penalite retard
  penaliteRetard?: number
  montantDistribuable?: number
}

// --- Statut de declaration mensuel (Phase 10b) ---

export type StatutDeclaration = 'DECLARE' | 'DANS_FENETRE' | 'EN_RETARD'

export type StatutDeclarationResponse = {
  proprieteId: number
  proprieteNom: string
  /** "YYYY-MM" - mois N-1 a declarer */
  moisADeclarer: string
  statut: StatutDeclaration
  /** Jours restants avant le 5 (peut etre negatif si retard) */
  joursRestants: number
  dansFenetre: boolean
  penaliteSiDeclarationMaintenant: number
  dateSoumission?: string | null
  revenuId?: number | null
}

/** Création directe par admin */
export type RevenuRequest = {
  proprieteId: number
  montantTotal: number
  date?: string
}

/** Soumission par un propriétaire */
export type SubmissionRevenuRequest = {
  proprieteId: number
  montantTotal: number
  periodeDebut?: string
  periodeFin?: string
}

export type RefusRevenuRequest = {
  motif: string
}

// --- Dashboard ---

export type DashboardInvestisseurResponse = {
  nombreProprietes: number
  totalParts: number
  totalInvesti: number
  valeurPortefeuille: number
  totalDividendes: number
  revenusAnnuelsPrevisionnels: number
  annoncesOuvertes: number
  notificationsNonLues: number
}

export type DashboardAdminResponse = {
  nombreInvestisseurs: number
  nombreProprietes: number
  partsVendues: number
  volumeTransactions: number
  dividendesDistribues: number
  annoncesOuvertes: number
}

// --- Notifications ---

export type NotificationResponse = {
  id: number
  titre?: string
  message: string
  /** Backend FURSA utilise TypeMessage */
  type?: TypeMessage
  /** Backend FURSA expose "lu", on accepte aussi "estLue" (legacy) */
  lu?: boolean
  estLue?: boolean
  date?: string
  dateCreation?: string
  metadata?: Record<string, unknown>
}

// --- Wallet (Phase 10a) ---

export type TypeWalletTransaction =
  | 'TOPUP'
  | 'DEBIT_ACHAT_PARTS'
  | 'DEBIT_ACHAT_REVENTE'
  | 'CREDIT_DIVIDENDE'
  | 'CREDIT_VENTE_PARTS'
  | 'CREDIT_REVENTE'
  | 'CREDIT_REFUND_ACHAT'
  | 'DEBIT_WITHDRAW'
  | 'AJUSTEMENT_ADMIN'

export type WalletResponse = {
  id: number
  userId: number | null
  userEmail: string | null
  userNom: string | null
  userPrenom: string | null
  solde: number
  devise: string
  createdAt: string
  updatedAt: string
}

export type WalletTransactionResponse = {
  id: number
  walletId: number
  type: TypeWalletTransaction
  /** Signe : positif = credit, negatif = debit */
  montant: number
  soldeApres: number
  libelle: string | null
  refTable: string | null
  refId: number | null
  metadata: string | null
  createdAt: string
}

export type WalletStats = {
  solde: number
  devise: string
  totalCredite: number
  totalDebite: number
  nbMouvements: number
  dernierMouvement: string
}

export type AjustementWalletRequest = {
  /** Montant signe : positif = credit, negatif = debit */
  montant: number
  motif: string
}

// --- Erreurs API ---

export type ApiErrorBody = {
  timestamp: string
  status: number
  error: string
  message: string
  fieldErrors?: Record<string, string>
}
