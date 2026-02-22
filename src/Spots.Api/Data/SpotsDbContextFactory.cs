using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Spots.Api.Data;

public class SpotsDbContextFactory : IDesignTimeDbContextFactory<SpotsDbContext>
{
    public SpotsDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SpotsDbContext>();
        optionsBuilder.UseSqlite("Data Source=spots.db");

        return new SpotsDbContext(optionsBuilder.Options);
    }
}
