
import datetime
import os 
import shutil

def prune():
    strtime = "%d_%m_%y"

    backups = next(os.walk('./backups'))[1]
    partial_backups = next(os.walk('./partial_backups'))[1]
    found = 0

    today = datetime.date.today()

    period_end = today

    while found < len(backups):
        
        period_start = period_end - datetime.timedelta(days=7)
        cursor = period_start 
        
        during_period = []
        while cursor <= period_end:
            if "backup_" + cursor.strftime(strtime) in backups:
                if today - cursor > datetime.timedelta(days=7):
                    during_period.append("backup_" + cursor.strftime(strtime))
                found += 1
            cursor += datetime.timedelta(days=1)
        
        for backup in during_period[1:]:
            shutil.rmtree(f"./backups/{backup}")

        period_end -= datetime.timedelta(8)
    
    for partial_backup in partial_backups:
        date = datetime.datetime.strptime(partial_backup.replace("partial_backup_", ""), "%d_%m_%y_%H_%M")
        #if date < datetime.datetime.now() - datetime.timedelta(days=90):
        #    shutil.rmtree(f"./partial_backups/{partial_backup}")
        #    continue 
        # Remove every other if older than 2 days
        if date < datetime.datetime.now() - datetime.timedelta(days=2) and date.hour % 2 != 0:
            shutil.rmtree(f"./partial_backups/{partial_backup}/")
        # Remove all but every 4th hour if older than a week
        elif date < datetime.datetime.now() - datetime.timedelta(days=7) and date.hour % 4 != 0:
            shutil.rmtree(f"./partial_backups/{partial_backup}/")
        # Remove all renders which aren't on a thursday at 12 pm before 2 weeks
        elif date < datetime.datetime.now() - datetime.timedelta(days=14) and (date.weekday() % 7 != 4 or date.hour != 12):
            shutil.rmtree(f"./partial_backups/{partial_backup}/")