export function OutputLabel({
  productName,
  country,
  language,
  templateType,
  templateVersion
}: {
  productName: string;
  country: string;
  language: string;
  templateType?: string;
  templateVersion?: string;
}) {
  return (
    <dl
      style={{
        display: "grid",
        gap: 6,
        gridTemplateColumns: "120px 1fr",
        margin: 0
      }}
    >
      <dt>Product</dt>
      <dd>{productName}</dd>
      <dt>Country</dt>
      <dd>{country}</dd>
      <dt>Language</dt>
      <dd>{language}</dd>
      {templateType ? (
        <>
          <dt>Template</dt>
          <dd>
            {templateType} {templateVersion ? `v${templateVersion}` : ""}
          </dd>
        </>
      ) : null}
    </dl>
  );
}

