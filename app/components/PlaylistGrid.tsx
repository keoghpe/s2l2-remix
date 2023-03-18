const PlaylistGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}>
    {children}
  </div>
);

export default PlaylistGrid;
