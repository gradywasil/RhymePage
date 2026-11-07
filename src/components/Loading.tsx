const Loading = ({ label = "Loading" }: { label?: string }) => (
  <div className="flex w-full flex-1 items-center justify-center py-16" role="status" aria-label={label}>
    <span className="rp-loading" />
  </div>
);

export default Loading;
