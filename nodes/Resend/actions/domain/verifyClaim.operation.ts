import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from "n8n-workflow";
import { apiRequest } from "../../transport";
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from "../../utils/dynamicFields";

export const description: INodeProperties[] = [
  {
    displayName:
      "Add the TXT record returned by the Claim Domain operation before calling this. Resend checks the TXT record and runs ownership-safety checks before transferring the domain. Poll Get Domain Claim to follow the status.",
    name: "verifyClaimNotice",
    type: "notice",
    default: "",
    displayOptions: {
      show: {
        resource: ["domains"],
        operation: ["verifyClaim"],
      },
    },
  },
  createDynamicIdField({
    fieldName: "domainId",
    resourceName: "domain",
    displayName: "Domain",
    required: true,
    placeholder: "d91cd9bd-1176-453e-8fc1-35364d380206",
    description:
      'The placeholder Domain ID returned when the claim was created. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ["domains"],
        operation: ["verifyClaim"],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainId = resolveDynamicIdValue(this, "domainId", index);

  const response = await apiRequest.call(
    this,
    "POST",
    `/domains/${encodeURIComponent(domainId)}/claim/verify`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
