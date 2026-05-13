export const BUTTON_STYLE_SECONDARY =
  'display:inline-block; text-decoration:none; background-color:#fff; color:#4a4a4a; padding:12px 24px; font-family: Arial,sans-serif; font-size:14px;font-weight:600; border:1px solid #d1d1d1; border-radius:6px; min-width:120px; margin: 12px 6px 0 6px;';

export const BUTTON_STYLE_PRIMARY =
  'display:inline-block; text-decoration:none; background-color:#ff6d5a; color: #fff; padding:12px 24px; font-family: Arial,sans-serif; font-size:14px;font-weight:600; border-radius:6px; min-width:120px; margin: 12px 2px 0 2px;';

export const ACTION_RECORDED_PAGE = `
	<html lang='en'>

	<head>
		<meta charset='UTF-8' />
		<meta name='viewport' content='width=device-width, initial-scale=1.0' />
		<link rel='icon' type='image/png' href='https://n8n.io/favicon.ico' />
		<link
			href='https://fonts.googleapis.com/css?family=Open+Sans'
			rel='stylesheet'
			type='text/css'
		/>
		<title>Action recorded</title>
		<style>
			*,
			::after,
			::before {
				box-sizing: border-box;
				margin: 0;
				padding: 0;
			}
			body {
				font-family: Open Sans, sans-serif;
				font-weight: 400;
				font-size: 12px;
				display: flex;
				flex-direction: column;
				justify-content: start;
				background-color: #FBFCFE;
			}
			.container {
				margin: auto;
				text-align: center;
				padding-top: 24px;
				width: 448px;
			}
			.card {
				padding: 24px;
				background-color: white;
				border: 1px solid #DBDFE7;
				border-radius: 8px;
				box-shadow: 0px 4px 16px 0px #634DFF0F;
				margin-bottom: 16px;
			}
			.n8n-link a {
				color: #7E8186;
				font-weight: 600;
				font-size: 12px;
				text-decoration: none;
			}
			.n8n-link svg {
				display: inline-block;
				vertical-align: middle;
			}
			.header h1 {
				color: #525356;
				font-size: 20px;
				font-weight: 400;
				padding-bottom: 8px;
			}
			.header p {
				color: #7E8186;
				font-size: 14px;
				font-weight: 400;
			}
		</style>
	</head>

	<body>
		<div class='container'>
			<section>
				<div class='card'>
					<div class='header'>
						<h1>Got it, thanks</h1>
						<p>This page can be closed now</p>
					</div>
				</div>
				<div class='n8n-link'>
					<a
						href='https://n8n.io/?utm_source=n8n-internal&amp;utm_medium=send-and-wait'
						target='_blank'
					>
						Automated with n8n
					</a>
				</div>
			</section>
		</div>
	</body>

</html>`;

export function createEmailBody(
  message: string,
  buttons: string,
  options?: { instanceId?: string },
) {
  let footerHtml = '';
  if (options?.instanceId !== undefined) {
    const utm_campaign = options.instanceId
      ? `&utm_campaign=${options.instanceId}`
      : '';
    const n8nWebsiteLink = `https://n8n.io/?utm_source=n8n-internal&utm_medium=send-and-wait${utm_campaign}`;
    footerHtml = `
				<!-- Footer -->
				<table width="100%" cellpadding="0" cellspacing="0" border="0"
					style="text-align: center; color: #7e8186; font-family: Arial, sans-serif; font-size: 12px;">
					<tr>
						<td>
							<a href="${n8nWebsiteLink}"
								target="_blank"
								style="color: #7e8186; text-decoration: none;">Automated with n8n</a>
						</td>
					</tr>
				</table>`;
  }
  return `
<!DOCTYPE html>
<html lang='en'>

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>n8n Approval Request</title>
</head>

<body
	style="font-family: Arial, sans-serif; font-size: 12px; background-color: #fbfcfe; margin: 0; padding: 0;">
	<table width="100%" cellpadding="0" cellspacing="0"
		style="background-color:#fbfcfe; border: 1px solid #dbdfe7; border-radius: 8px;">
		<tr>
			<td align="center" style="padding: 24px 0;">
				<table width="448" cellpadding="0" cellspacing="0" border="0"
					style="width: 100%; max-width: 448px; background-color: #ffffff; border: 1px solid #dbdfe7; border-radius: 8px; padding: 24px; box-shadow: 0px 4px 16px rgba(99, 77, 255, 0.06);">
					<tr>
						<td
							style="text-align: center; padding-top: 8px; font-family: Arial, sans-serif; font-size: 14px; color: #7e8186;">
							<p style="white-space: pre-line;">${message}</p>
						</td>
					</tr>
					<tr>
						<td align="center" style="padding-top: 12px;">
								${buttons}
						</td>
					</tr>
				</table>

				<!-- Divider -->
				<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
					<tr>
						<td style="border-top: 0px solid #dbdfe7;"></td>
					</tr>
				</table>

				${footerHtml}
			</td>
		</tr>
	</table>
</body>

</html>
	`;
}

/** @deprecated Use createEmailBody instead */
export function createEmailBodyWithN8nAttribution(
  message: string,
  buttons: string,
  instanceId?: string,
) {
  return createEmailBody(message, buttons, { instanceId: instanceId ?? '' });
}

/** @deprecated Use createEmailBody instead */
export function createEmailBodyWithoutN8nAttribution(
  message: string,
  buttons: string,
) {
  return createEmailBody(message, buttons);
}
