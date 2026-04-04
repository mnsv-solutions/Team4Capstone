export class DocumentDetailItemDto {
  file_name: string;
  path: string;
}

export class GetDocumentDetailsResponseDto {
  governmentIdProofUrl?: DocumentDetailItemDto;
  incomeProofUrl?: DocumentDetailItemDto;
  bankStatementUrl?: DocumentDetailItemDto;
}
