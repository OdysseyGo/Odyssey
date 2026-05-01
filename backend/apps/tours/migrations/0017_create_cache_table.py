from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0016_alter_puzzle_puzzle_type_compasspuzzledetail"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS odyssey_cache (
                cache_key varchar(255) NOT NULL PRIMARY KEY,
                value text NOT NULL,
                expires timestamp with time zone NOT NULL
            );
            CREATE INDEX IF NOT EXISTS odyssey_cache_expires
                ON odyssey_cache (expires);
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS odyssey_cache;
            """,
        ),
    ]
