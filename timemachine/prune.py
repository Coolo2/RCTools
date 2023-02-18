
import datetime
import os 

def prune():
    strtime = "%d_%m_%y"

    backups = os.listdir("backups")
    partial_backups = os.listdir("partial_backups")
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
            os.rmdir(f"./backups/{backup}")

        period_end -= datetime.timedelta(8)
    
    for partial_backup in partial_backups:
        date = datetime.datetime.strptime(partial_backup.replace("partial_backup_", ""), "%d_%m_%y_%H_%M")
        if date < datetime.datetime.now() - datetime.timedelta(days=14):
            os.rmdir(f"./partial_backups/{partial_backup}")