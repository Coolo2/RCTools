
class Editor():
    def __init__(self, id : id, name : str, nation : str, nation_config : dict, admin : bool, editor : bool):
        self.id = id 
        self.name = name 
        self.nation = nation 
        self.admin = admin
        self.nation_config = nation_config
        self.editor = True if admin else editor
    
    def to_dict(self) -> dict:
        return {"id":self.id, "name":self.name, "nation":self.nation, "config":self.nation_config, "admin":self.admin, "global":self.editor}