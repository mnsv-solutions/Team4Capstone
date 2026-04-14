export class DocumentDetailItemDto {
  documentType: string;
  fileName: string;
  isVerified: boolean;
  url: string;
}

export class GetDocumentDetailsResponseDto {
  documents: DocumentDetailItemDto[];
}
