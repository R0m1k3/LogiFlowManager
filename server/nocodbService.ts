// Service for interacting with NocoDB
import { storage } from "./storage";

export interface InvoiceVerificationResult {
  exists: boolean;
  error?: string;
}

export async function verifyInvoiceReference(
  groupId: number, 
  invoiceReference: string
): Promise<InvoiceVerificationResult> {
  try {
    // Get group with NocoDB configuration
    const group = await storage.getGroup(groupId);
    
    if (!group || !group.nocodbConfigId || !group.nocodbTableId) {
      return { exists: false, error: "No NocoDB configuration for this group" };
    }

    // Get NocoDB configuration
    const nocodbConfig = await storage.getNocodbConfig(group.nocodbConfigId);
    
    if (!nocodbConfig) {
      return { exists: false, error: "NocoDB configuration not found" };
    }

    const columnName = group.invoiceColumnName || "Ref Facture";
    
    // Make request to NocoDB API
    // URL format: {baseUrl}/api/v1/db/data/noco/{projectId}/{tableId}
    const url = `${nocodbConfig.baseUrl}/api/v1/db/data/noco/${nocodbConfig.projectId}/${group.nocodbTableId}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "xc-token": nocodbConfig.apiToken,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return { exists: false, error: `NocoDB API error: ${response.status}` };
    }

    const data = await response.json();
    
    // Check if invoice reference exists in the specified column
    const exists = data.list?.some((row: any) => 
      row[columnName] && row[columnName].toString().trim() === invoiceReference.trim()
    ) || false;

    return { exists };
    
  } catch (error) {
    console.error("Error verifying invoice reference:", error);
    return { exists: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Bulk verify multiple invoice references
export async function verifyMultipleInvoiceReferences(
  invoiceReferences: { groupId: number; invoiceReference: string; deliveryId: number }[]
): Promise<Record<number, InvoiceVerificationResult>> {
  const results: Record<number, InvoiceVerificationResult> = {};
  
  // Process in parallel for better performance
  const promises = invoiceReferences.map(async ({ groupId, invoiceReference, deliveryId }) => {
    const result = await verifyInvoiceReference(groupId, invoiceReference);
    results[deliveryId] = result;
  });
  
  await Promise.all(promises);
  
  return results;
}